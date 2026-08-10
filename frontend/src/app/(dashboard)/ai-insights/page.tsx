"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AiInsightsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === "STUDENT") {
          const res = await api("/ai/predict/student/me");
          setData(res);
        } else if (user?.role === "FACULTY") {
          const res = await api("/ai/predict/faculty/me");
          setData(res);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "DECLINING": return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Predictive Insights</h1>
          <p className="text-muted-foreground">Powered by deterministic attendance projections</p>
        </div>
      </div>

      {user?.role === "STUDENT" && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((insight: any, i: number) => (
            <Card key={i} className={cn("glass-panel overflow-hidden border-t-4", 
              insight.riskLevel === 'CRITICAL' ? "border-t-red-500" :
              insight.riskLevel === 'HIGH' ? "border-t-orange-500" :
              insight.riskLevel === 'MEDIUM' ? "border-t-yellow-500" :
              insight.riskLevel === 'LOW' ? "border-t-green-500" : "border-t-slate-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{insight.subjectName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{insight.subjectCode}</p>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel} RISK
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {insight.riskLevel === 'INSUFFICIENT_DATA' ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <p>{insight.recommendation}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-end border-b pb-4 border-border/50">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Attendance</p>
                        <p className="text-2xl font-bold">{insight.currentAttendance}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Recent Trend</p>
                        <div className="flex items-center justify-end gap-1">
                          {renderTrendIcon(insight.trend)}
                          <span className="text-sm font-medium">{insight.trend}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">If you miss next class:</span>
                        <span className="font-semibold text-orange-500">{insight.missNextImpact}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Classes to secure {insight.targetAttendance}%:</span>
                        <span className="font-semibold">{insight.classesRequiredToTarget} classes</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                      <div className="flex gap-2">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p>{insight.recommendation}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {user?.role === "FACULTY" && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-panel text-center p-6">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-orange-500">{data.highRiskCount}</p>
              <p className="text-sm text-muted-foreground font-medium">High Risk Students</p>
            </Card>
            <Card className="glass-panel text-center p-6 border-red-500/20">
              <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-500">{data.criticalRiskCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Critical Risk Students</p>
            </Card>
            <Card className="glass-panel text-center p-6">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-xl font-bold mt-3">Classes Stable</p>
              <p className="text-sm text-muted-foreground font-medium">Baseline Healthy</p>
            </Card>
          </div>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{data.recommendation}</p>
            </CardContent>
          </Card>

          {data.riskyStudents.length > 0 && (
            <Card className="glass-panel overflow-hidden">
              <CardHeader>
                <CardTitle>Top Students Requiring Intervention</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Subject</th>
                        <th className="px-6 py-3 font-medium text-right">Attendance</th>
                        <th className="px-6 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {data.riskyStudents.map((s: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <td className="px-6 py-4 font-medium">{s.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{s.subject}</td>
                          <td className="px-6 py-4 text-right font-bold">{s.pct}%</td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn("px-2 py-1 rounded text-xs font-bold", getRiskColor(s.risk))}>
                              {s.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
