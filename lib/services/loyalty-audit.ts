import type { AdminIdentity } from "@/lib/admin";
import { getLoyaltyAuditEventPresentation } from "@/lib/loyalty-audit-presentation";
import { prisma } from "@/lib/prisma";

const metadataRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export async function getLoyaltyAuditHistory(
  identity: AdminIdentity,
  take = 12
) {
  const audit = await prisma.adminAuditLog.findMany({
    where: {
      OR: [
        { action: { startsWith: "loyalty." } },
        { action: { startsWith: "loyalty:" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const orderIds = audit
    .filter((item) => item.entity === "Order" && item.entityId)
    .map((item) => item.entityId as string);
  const actorIds = audit.flatMap((item) => (item.actorUserId ? [item.actorUserId] : []));
  const customerIds = audit.flatMap((item) => {
    const metadata = metadataRecord(item.metadata);
    const metadataUserId = typeof metadata?.userId === "string" ? metadata.userId : null;
    return [item.entity === "User" ? item.entityId : null, metadataUserId].filter(
      (value): value is string => Boolean(value)
    );
  });
  const rewardIds = audit.flatMap((item) => {
    const metadata = metadataRecord(item.metadata);
    const metadataRewardId = typeof metadata?.rewardId === "string" ? metadata.rewardId : null;
    return [item.entity === "LoyaltyReward" ? item.entityId : null, metadataRewardId].filter(
      (value): value is string => Boolean(value)
    );
  });

  const [orders, users, rewards] = await Promise.all([
    orderIds.length
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, orderNumber: true },
        })
      : [],
    actorIds.length || customerIds.length
      ? prisma.user.findMany({
          where: {
            OR: [
              ...(customerIds.length ? [{ id: { in: customerIds } }] : []),
              ...(actorIds.length ? [{ clerkUserId: { in: actorIds } }] : []),
            ],
          },
          select: { id: true, clerkUserId: true, fullName: true, email: true },
        })
      : [],
    rewardIds.length
      ? prisma.loyaltyReward.findMany({
          where: { id: { in: rewardIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const orderById = new Map(orders.map((order) => [order.id, order.orderNumber]));
  const customerById = new Map(users.map((user) => [user.id, user.fullName || user.email]));
  const actorByClerkId = new Map(users.map((user) => [user.clerkUserId, user.fullName || user.email]));
  const rewardById = new Map(rewards.map((reward) => [reward.id, reward.name]));

  return audit.map((item) => {
    const metadata = metadataRecord(item.metadata);
    const customerId = item.entity === "User"
      ? item.entityId
      : typeof metadata?.userId === "string"
        ? metadata.userId
        : null;
    const rewardId = item.entity === "LoyaltyReward"
      ? item.entityId
      : typeof metadata?.rewardId === "string"
        ? metadata.rewardId
        : null;
    const actorName = item.actorUserId === identity.userId
      ? identity.displayName || identity.email
      : item.actorUserId
        ? actorByClerkId.get(item.actorUserId)
        : null;
    const presentation = getLoyaltyAuditEventPresentation(item, {
      actorName,
      orderNumber: item.entityId ? orderById.get(item.entityId) : null,
      customerName: customerId ? customerById.get(customerId) : null,
      rewardName: rewardId ? rewardById.get(rewardId) : null,
    });

    return {
      id: item.id,
      createdAt: item.createdAt,
      ...presentation,
    };
  });
}
