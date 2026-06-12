"use client";

import { useToastStore } from "./use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border w-80 backdrop-blur-md
                ${isError ? "bg-red-50/90 border-red-200 text-red-900" : 
                  isSuccess ? "bg-green-50/90 border-green-200 text-green-900" : 
                  "bg-white/90 border-slate-200 text-slate-900"}
              `}
            >
              <div className="shrink-0 mt-0.5">
                {isError ? <AlertCircle className="w-5 h-5 text-red-600" /> : 
                 isSuccess ? <CheckCircle className="w-5 h-5 text-green-600" /> : 
                 <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{toast.title}</h4>
                {toast.description && (
                  <p className="text-xs mt-1 opacity-90">{toast.description}</p>
                )}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
