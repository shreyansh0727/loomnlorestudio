import "server-only";

import {
  demoOrderEvents,
  demoOrderItems,
  demoOrders,
} from "@/lib/demo-transactions";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";
import type { Business, Order, OrderEvent, OrderItem } from "@/lib/types";

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  events: OrderEvent[];
}

function sortDetails(order: OrderWithDetails) {
  order.items = [...(order.items ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  order.events = [...(order.events ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return order;
}

export async function getMyOrders(userId: string, limit = 50) {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return [] as OrderWithDetails[];

  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [] as OrderWithDetails[];
  return (data as unknown as OrderWithDetails[]).map((order) =>
    sortDetails({ ...order, events: [] }),
  );
}

export async function getMyOrder(orderId: string, userId: string) {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), events:order_events(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return sortDetails(data as unknown as OrderWithDetails);
}

export async function getOrderByToken(token: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return null;
  }

  if (!isSupabaseConfigured) {
    const order = demoOrders.find((candidate) => candidate.access_token === token);
    if (!order) return null;
    return sortDetails({
      ...order,
      items: demoOrderItems.filter((item) => item.order_id === order.id),
      events: demoOrderEvents.filter((event) => event.order_id === order.id),
    });
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("*, items:order_items(*), events:order_events(*)")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return sortDetails(data as unknown as OrderWithDetails);
}

export async function findOrderByNumberAndEmail(orderNumber: string, email: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("id, access_token, order_number")
    .eq("order_number", orderNumber.trim().toUpperCase())
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; access_token: string; order_number: string };
}

export async function getMyBusiness(userId: string) {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Business;
}

export async function linkGuestOrdersToUser(
  userId: string,
  email: string,
  emailConfirmed: boolean,
) {
  if (!emailConfirmed || !email) return;
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return;

  await admin
    .from("orders")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("email", email.trim().toLowerCase());
}
