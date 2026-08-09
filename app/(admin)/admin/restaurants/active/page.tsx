import { redirect } from 'next/navigation'

// Static route takes priority over [restaurantId] — redirects to the filtered list.
export default function ActiveRestaurantsRedirect() {
  redirect('/admin/restaurants?status=ACTIVE')
}
