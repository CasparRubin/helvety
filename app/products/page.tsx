import { redirect } from "next/navigation";

/**
 * Products page - redirects to home
 * The products catalog is now displayed on the home page
 */
export default function ProductsPage() {
  redirect("/");
}
