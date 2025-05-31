'use client'
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation"
import { Button } from "./ui/button";

export default function GoBackButton() {
      const router = useRouter()
    
  return  <div className="text-center py-8">
        {/* <p className="text-red-500 mb-4">{error || "Sale not found"}</p> */}
        <Button variant={"ghost"} onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
}
