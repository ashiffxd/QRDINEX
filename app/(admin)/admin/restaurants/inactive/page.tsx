import { redirect } from 'next/navigation'

// Static route takes priority over [restaurantId] — redirects to the filtered list.
export default function InactiveRestaurantsRedirect() {
  redirect('/admin/restaurants?status=INACTIVE')
}
