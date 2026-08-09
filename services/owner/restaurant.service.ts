import prisma from '@/lib/prisma'

export interface UpdateRestaurantProfileInput {
  restaurantName?: string
  logoUrl?: string | null
  description?: string | null
  address?: string
  city?: string
  phone?: string | null
  email?: string | null
}

export interface UpdateBillingSettingsInput {
  serviceChargeEnabled?: boolean
  serviceChargePercent?: number
  currency?: string
}

/**
 * Fetches restaurant profile & settings.
 */
export async function getRestaurantProfile(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      restaurantCode: true,
      restaurantName: true,
      logoUrl: true,
      description: true,
      address: true,
      city: true,
      phone: true,
      email: true,
      status: true,
      serviceChargeEnabled: true,
      serviceChargePercent: true,
      currency: true,
    },
  })

  if (!restaurant) {
    throw new Error('RESTAURANT_NOT_FOUND')
  }

  return {
    ...restaurant,
    serviceChargePercent: Number(restaurant.serviceChargePercent ?? 0),
  }
}

/**
 * Updates restaurant profile metadata.
 */
export async function updateRestaurantProfile(
  restaurantId: string,
  input: UpdateRestaurantProfileInput
) {
  const { restaurantName, logoUrl, description, address, city, phone, email } = input

  if (restaurantName !== undefined && !restaurantName.trim()) {
    throw new Error('INVALID_RESTAURANT_NAME')
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(restaurantName !== undefined ? { restaurantName: restaurantName.trim() } : {}),
      ...(logoUrl !== undefined ? { logoUrl: logoUrl ? logoUrl.trim() : null } : {}),
      ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
      ...(address !== undefined ? { address: address.trim() } : {}),
      ...(city !== undefined ? { city: city.trim() } : {}),
      ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
      ...(email !== undefined ? { email: email ? email.trim().toLowerCase() : null } : {}),
    },
    select: {
      id: true,
      restaurantCode: true,
      restaurantName: true,
      logoUrl: true,
      description: true,
      address: true,
      city: true,
      phone: true,
      email: true,
      status: true,
      serviceChargeEnabled: true,
      serviceChargePercent: true,
      currency: true,
    },
  })

  return {
    ...updated,
    serviceChargePercent: Number(updated.serviceChargePercent ?? 0),
  }
}

/**
 * Fetches restaurant billing and currency settings.
 */
export async function getBillingSettings(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      serviceChargeEnabled: true,
      serviceChargePercent: true,
      currency: true,
    },
  })

  if (!restaurant) {
    throw new Error('RESTAURANT_NOT_FOUND')
  }

  return {
    serviceChargeEnabled: restaurant.serviceChargeEnabled ?? false,
    serviceChargePercent: Number(restaurant.serviceChargePercent ?? 0),
    currency: restaurant.currency ?? 'INR',
  }
}

/**
 * Updates restaurant service charge and currency settings.
 */
export async function updateBillingSettings(
  restaurantId: string,
  input: UpdateBillingSettingsInput
) {
  const { serviceChargeEnabled, serviceChargePercent, currency } = input

  if (serviceChargePercent !== undefined) {
    if (isNaN(serviceChargePercent) || serviceChargePercent < 0 || serviceChargePercent > 100) {
      throw new Error('INVALID_SERVICE_CHARGE_PERCENT')
    }
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(serviceChargeEnabled !== undefined ? { serviceChargeEnabled } : {}),
      ...(serviceChargePercent !== undefined ? { serviceChargePercent } : {}),
      ...(currency !== undefined ? { currency: currency.toUpperCase().trim() } : {}),
    },
    select: {
      id: true,
      serviceChargeEnabled: true,
      serviceChargePercent: true,
      currency: true,
    },
  })

  return {
    serviceChargeEnabled: updated.serviceChargeEnabled ?? false,
    serviceChargePercent: Number(updated.serviceChargePercent ?? 0),
    currency: updated.currency ?? 'INR',
  }
}
