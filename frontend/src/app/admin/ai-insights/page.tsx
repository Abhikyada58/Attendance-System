"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, ShieldAlert, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAiInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api("/ai/predict/admin");
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-6 text-red-600 font-medium text-center">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System AI Insights</h1>
          <p className="text-muted-foreground">Macro-level predictive analytics</p>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-muted-foreground font-medium">Institution Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {data.systemAverage}%
                  </div>
                  <span className={cn("px-4 py-2 rounded-full text-sm font-bold border", getRiskColor(data.systemRiskLevel))}>
                    {data.systemRiskLevel} RISK
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-muted-foreground font-medium">Data Points Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {data.dataPointsAnalyzed}
                  </div>
                  <BarChart3 className="w-10 h-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={cn("glass-panel border-l-4", data.systemRiskLevel === 'LOW' ? 'border-l-green-500' : 'border-l-orange-500')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldAlert className="w-5 h-5 text-primary" />
                AI Strategy Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">
                {data.trendRecommendation}
              </p>
              <p className="text-xs text-slate-400 mt-4">
                Prediction generated at: {new Date(data.predictionTimestamp).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
