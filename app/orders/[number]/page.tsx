import Link from "next/link";
import { notFound } from "next/navigation";

import { formatPrice } from "@/lib/format";
import { getOrder } from "@/lib/store";

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getOrder(number);
  if (!order) notFound();

  const total = order.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-neutral-500">Order #{order.number}</p>
      <h1 className="mt-1 text-2xl font-semibold">Thanks, your order is {order.status}.</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Placed {order.placedAt} for {order.email}.
      </p>
      <ul className="mt-6 divide-y divide-neutral-200 rounded-2xl bg-white ring-1 ring-neutral-200">
        {order.items.map((item) => (
          <li key={`${item.slug}:${item.variant}`} className="flex justify-between px-5 py-3 text-sm">
            <span>
              {item.quantity} × {item.name}
              {item.variant && <span className="text-neutral-500"> · {item.variant}</span>}
            </span>
            <span>{formatPrice(item.priceCents * item.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between px-5 py-3 text-sm font-medium">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </li>
      </ul>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        Back to the shop
      </Link>
    </div>
  );
}
