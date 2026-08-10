'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { FileSpreadsheet, FileText, Download, File, Loader2 } from 'lucide-react';

export default function ReportsDashboard() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string, format: string) => {
    setDownloading(`${type}-${format}`);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      // Trigger the browser to download via standard anchor navigation since the API serves streams.
      // In a real app we might fetch as Blob if we need headers, but here we can just use window.open 
      // or an anchor tag assuming token is in cookie or we append it. Since we use Bearer tokens, 
      // we must fetch as blob and create object URL.
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/reports/${type}/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Get filename from Content-Disposition header if possible, else default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report.${format}`;
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) filename = matches[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Export</h1>
        <p className="text-muted-foreground">Generate professional attendance reports in CSV, Excel, or PDF.</p>
      </div>

      {/* Global Filters */}
      <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Global Report Filters</CardTitle>
          <CardDescription>Apply date ranges before downloading.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[180px]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">End Date</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[180px]" />
          </div>
          <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Filters</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* STUDENT REPORT CARD */}
        {(user?.role === 'STUDENT' || user?.role === 'ADMIN') && (
          <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow group hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Student Attendance Report
              </CardTitle>
              <CardDescription>
                Export all subject attendance records, percentages, and statuses for a student.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border" 
                  onClick={() => handleDownload('student', 'csv')}
                  disabled={!!downloading}
                >
                  {downloading === 'student-csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <File className="w-4 h-4 mr-2 text-gray-500" />}
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border" 
                  onClick={() => handleDownload('student', 'excel')}
                  disabled={!!downloading}
                >
                  {downloading === 'student-excel' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />}
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border bg-red-500/5 hover:bg-red-500/10 text-red-600 hover:text-red-700" 
                  onClick={() => handleDownload('student', 'pdf')}
                  disabled={!!downloading}
                >
                  {downloading === 'student-pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FACULTY REPORT CARD */}
        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow group hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Faculty Class Report
              </CardTitle>
              <CardDescription>
                Export attendance metrics for all assigned classes and subjects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border" 
                  onClick={() => handleDownload('faculty', 'csv')}
                  disabled={!!downloading}
                >
                  {downloading === 'faculty-csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <File className="w-4 h-4 mr-2 text-gray-500" />}
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border" 
                  onClick={() => handleDownload('faculty', 'excel')}
                  disabled={!!downloading}
                >
                  {downloading === 'faculty-excel' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />}
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 neo-border bg-red-500/5 hover:bg-red-500/10 text-red-600 hover:text-red-700" 
                  onClick={() => handleDownload('faculty', 'pdf')}
                  disabled={!!downloading}
                >
                  {downloading === 'faculty-pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
