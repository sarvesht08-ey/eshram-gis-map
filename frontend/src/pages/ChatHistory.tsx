import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, RefreshCw, Copy, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { useApiClient } from "@/services/ApiService"; // <-- your ApiService singleton

interface HistoryItem {
  question: string;
  sql: string;
  timestamp: string;
  success: boolean;
}

export function ChatHistory({ onReplay }: { onReplay: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { client } = useApiClient();
  

  useEffect(() => {
    if (open) {
      client.getQueryHistory()                       
        .then((data) => setHistory(data.history)) 
        .catch(console.error);
    }
  }, [open,client]);

  const handleCopy = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  return (
    <>
      {/* Button in header */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Database className="w-4 h-4" />
        History
      </Button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Query History</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history available</p>
              ) : (
                history.map((h, idx) => (
                  <Card key={idx} className="shadow-sm border bg-white">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{h.question}</p>
                        {h.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(h.timestamp).toLocaleString()}
                      </div>
                      <details className="text-sm bg-gray-50 p-2 rounded border">
                        <summary className="cursor-pointer">View SQL</summary>
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 mt-2">
                          {h.sql}
                        </pre>
                      </details>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(h.sql)}
                          className="flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy SQL
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            onReplay(h.question);
                            setOpen(false);
                          }}
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Replay
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
