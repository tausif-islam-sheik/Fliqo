import { SearchX } from "lucide-react";
import { Btn, Card, Container } from "@/components/ui";

export default function PaymentCancelPage() {
  return (
    <Container className="max-w-xl py-10">
      <Card className="p-8 text-center sm:p-10">
        <SearchX className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Payment cancelled</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Nothing was charged. Your search is still here whenever you&apos;re ready.
        </p>
        <Btn href="/" className="mt-6">Back to search</Btn>
      </Card>
    </Container>
  );
}
