'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Book, HelpCircle, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function HelpCenter() {
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await api.get('/support/articles');
      setArticles(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">How can we help you?</h1>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            className="pl-10 h-12 text-lg shadow-sm border-2 border-primary/20 focus:border-primary" 
            placeholder="Search for articles, guides, or troubleshooting..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-6">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center p-12 text-gray-500 border border-dashed rounded-lg">
            No articles found for your search. If you are a student, please visit your Ticket Dashboard to contact support.
          </div>
        ) : (
          filtered.map(article => (
            <Card key={article.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer neo-border group">
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Book className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {article.content}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mt-12 flex items-start">
        <HelpCircle className="w-8 h-8 text-blue-500 mr-4 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Need specific help with your Attendance?</h4>
          <p className="text-blue-800 text-sm">
            Please remember that Support Staff cannot modify your attendance. If you were marked Absent incorrectly, 
            please use the <strong>My Requests</strong> tab in your Student Dashboard to submit a formal Attendance Correction Request to your Faculty.
          </p>
        </div>
      </div>
    </div>
  );
}
