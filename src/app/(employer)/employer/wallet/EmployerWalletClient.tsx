"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, TrendingUp, Shield, Clock, Copy, CheckCircle, CircleDot } from "lucide-react";
import { formatCurrency, formatDate, getStorageUrl } from "@/lib/utils";
import Image from "next/image";

function EmployerWalletClientInner() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [wallet, setWallet] = useState<any>(null);
  const [gateways, setGateways] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [addGatewayId, setAddGatewayId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addTxId, setAddTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedTotal, setCopiedTotal] = useState(false);

  useEffect(() => {
    api.get("/employer/wallet").then((r) => {
      const d = r.data;
      setWallet(d.wallet || {});
      setGateways(d.gateways || []);
      setTransactions(d.transactions || []);
    }).catch(() => toast.error("Failed to load wallet")).finally(() => setLoading(false));
  }, []);

  // Handle payment callback status
  useEffect(() => {
    if (paymentStatus === "success") {
      toast.success("Payment successful! Your wallet has been credited.");
    } else if (paymentStatus === "failed") {
      toast.error("Payment failed. Please try again.");
    } else if (paymentStatus === "error") {
      toast.error("Payment processing error. Please contact support.");
    } else if (paymentStatus === "already_processed") {
      toast.info("This payment was already processed.");
    }
  }, [paymentStatus]);

  const selG = gateways.find((g: any) => String(g.id) === addGatewayId);
  const depFee = selG ? (Number(addAmount || 0) * Number(selG.percent_charge || 0)) / 100 : 0;
  const isPersonal = selG?.drive_type === 'personal';

  const handleAdd = async () => {
    if (!addGatewayId || !addAmount) return;
    setAddLoading(true);
    try {
      const payload: any = { gateway_id: Number(addGatewayId), amount: Number(addAmount) };
      if (isPersonal) {
        if (!addTxId) { toast.error("Please enter transaction ID"); setAddLoading(false); return; }
        payload.transaction_id = addTxId;
      }
      const res = await api.post("/employer/deposit", payload);
      
      // Handle bKash merchant payment
      if (res.data.requires_redirect && res.data.payment_id) {
        // Store transaction_id for callback
        sessionStorage.setItem('bkash_payment_id', res.data.payment_id);
        sessionStorage.setItem('bkash_trx_id', payload.transaction_id || '');
        
        if (res.data.payment_url) {
          window.location.href = res.data.payment_url;
          return;
        }
        
        // If no payment URL, show bKash popup
        toast.info("Please complete payment in bKash popup");
      }
      
      if (res.data.redirect_url) { window.location.href = res.data.redirect_url; return; }
      toast.success(res.data.message || "Deposit submitted");
      setAddAmount(""); setAddGatewayId(""); setAddTxId(""); setTab("overview");
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); } finally { setAddLoading(false); }
  };

  const copyNumber = () => {
    if (selG?.personal_number) {
      navigator.clipboard.writeText(selG.personal_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;

  const balance = Number(wallet?.balance || 0);
  const locked = Number(wallet?.locked_balance || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employer Wallet</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-full bg-primary/10"><Wallet className="h-8 w-8 text-primary" /></div><div><p className="text-sm text-muted-foreground">Balance</p><p className="text-2xl font-bold">{formatCurrency(balance)}</p></div></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-full bg-yellow-500/10"><Shield className="h-8 w-8 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">Locked (Escrow)</p><p className="text-2xl font-bold">{formatCurrency(locked)}</p></div></div></CardContent></Card>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add"><Plus className="h-4 w-4 mr-1" />Add Money</TabsTrigger>
          <TabsTrigger value="escrow"><Shield className="h-4 w-4 mr-1" />Escrow</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card><CardHeader><CardTitle>Transactions</CardTitle></CardHeader><CardContent>
            {!transactions.length ? <p className="text-center text-muted-foreground py-8">No transactions</p> : <div className="space-y-2">{transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={"p-2 rounded-full " + (t.type === "credit" ? "bg-green-50" : "bg-red-50")}>{t.type === "credit" ? <ArrowDownLeft className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-red-600" />}</div>
                  <div><p className="text-sm font-medium">{t.description || t.reference_type || "Transaction"}</p><p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p></div>
                </div>
                <span className={"font-semibold " + (t.type === "credit" ? "text-green-600" : "text-red-600")}>{t.type === "credit" ? "+" : "-"}{formatCurrency(t.amount)}</span>
              </div>
            ))}</div>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="add"><Card><CardHeader><CardTitle>Add Money</CardTitle></CardHeader><CardContent className="space-y-4">
          {gateways.length === 0 ? <p className="text-muted-foreground">No payment methods available</p> : <>
            <div className="space-y-2"><Label>Payment Method</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gateways.map((g: any) => {
                  const logo = getStorageUrl(g.logo);
                  const isSelected = String(g.id) === addGatewayId;
                  return (
                    <button key={g.id} type="button" onClick={() => { setAddGatewayId(String(g.id)); setAddTxId(""); }}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                      {logo ? (
                        <Image src={logo} alt={g.display_name || g.name} width={48} height={48} className="object-contain h-12 w-12" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><CircleDot className="h-6 w-6 text-primary" /></div>
                      )}
                      <span className="text-sm font-medium text-center">{g.display_name || g.name}</span>
                      {Number(g.percent_charge) > 0 && <span className="text-xs text-muted-foreground">{g.percent_charge}% fee</span>}
                      {isSelected && <div className="absolute top-2 right-2"><CheckCircle className="h-4 w-4 text-primary" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2"><Label>Amount (BDT)</Label><Input type="number" placeholder="Enter amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} min="10" />
              {selG && <p className="text-xs text-muted-foreground">Min: {formatCurrency(selG.min_amount)} - Max: {formatCurrency(selG.max_amount)}</p>}</div>

            {Number(addAmount) > 0 && selG && <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="flex justify-between text-sm"><span>Amount</span><span>{formatCurrency(Number(addAmount))}</span></div>
              {depFee > 0 && <div className="flex justify-between text-sm"><span>Fee</span><span>{formatCurrency(depFee)}</span></div>}
              <div className="flex justify-between text-sm font-semibold border-t pt-1"><span>Total</span><span>{formatCurrency(Number(addAmount) + depFee)}</span></div>
            </div>}

            {/* Personal Gateway: Show number, instructions, and total */}
            {isPersonal && selG && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-primary">Send Money To:</p>
                <div className="flex items-center gap-2 bg-background p-3 rounded-lg border">
                  <span className="text-lg font-mono font-bold flex-1">{selG.personal_number}</span>
                  <Button variant="ghost" size="sm" onClick={copyNumber}>
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {Number(addAmount) > 0 && (
                  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border">
                    <span className="text-lg font-mono font-bold flex-1">Total: {formatCurrency(Number(addAmount) + depFee)}</span>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(String(Number(addAmount) + depFee)); setCopiedTotal(true); setTimeout(() => setCopiedTotal(false), 2000); }}>
                      {copiedTotal ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                {selG.instruction && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selG.instruction}</p>}
              </div>
            )}

            {/* Personal Gateway: Transaction ID input */}
            {isPersonal && (
              <div className="space-y-2">
                <Label>Transaction ID *</Label>
                <Input placeholder="Enter transaction ID from your payment" value={addTxId} onChange={(e) => setAddTxId(e.target.value)} />
                <p className="text-xs text-muted-foreground">Enter the transaction ID you received after sending money</p>
              </div>
            )}

            <Button onClick={handleAdd} disabled={!addGatewayId || !addAmount || addLoading || (isPersonal && !addTxId)} className="w-full">{addLoading ? "Processing..." : "Add Money"}</Button>
          </>}
        </CardContent></Card></TabsContent>
        <TabsContent value="escrow"><Card><CardHeader><CardTitle>Escrow</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg"><p className="text-sm font-medium">How Escrow Works</p><p className="text-xs text-muted-foreground mt-1">When you assign a candidate to a remote job, the job budget is locked from your wallet into escrow. After the candidate completes work and you approve, funds are released to the candidate minus a platform fee.</p></div>
          {locked > 0 && <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20"><div className="flex items-center gap-2 mb-2"><Clock className="h-5 w-5 text-yellow-600" /><span className="font-semibold">Active Escrow</span></div><p className="text-sm text-muted-foreground">{formatCurrency(locked)} locked in active projects.</p></div>}
        </CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}

export default function EmployerWalletClient() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>}>
      <EmployerWalletClientInner />
    </Suspense>
  );
}
