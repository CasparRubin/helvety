/**
 * Product not found page
 */

import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <Package className="text-muted-foreground size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Product Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        The product you&apos;re looking for doesn&apos;t exist or may have been
        removed.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/products">
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
      </Button>
    </div>
  );
}
