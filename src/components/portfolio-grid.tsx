"use client"

import * as React from "react"
import { ExternalLink, X, FileImage, FileText } from "lucide-react"

type Portfolio = {
  id: string
  title: string
  description: string | null
  fileUrl: string | null
  imageUrl: string | null
  createdAt: Date
}

export function PortfolioGrid({ portfolios, showEditActions = false }: { portfolios: Portfolio[], showEditActions?: boolean }) {
  const [selectedItem, setSelectedItem] = React.useState<Portfolio | null>(null)

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <FileImage className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground/50">No portfolio items yet</h3>
        <p className="text-sm text-foreground/40 mt-1">This user hasn't added any work samples.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {portfolios.map((item) => (
          <div 
            key={item.id} 
            className="group relative cursor-pointer rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-xl transition-all"
            onClick={() => setSelectedItem(item)}
          >
            {/* Image Thumbnail */}
            <div className="aspect-[4/3] w-full bg-primary/5 relative overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-primary/40">
                  <FileText className="w-12 h-12 mb-2" />
                </div>
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  View Details
                </span>
              </div>
            </div>

            {/* Content info below image */}
            <div className="p-4 border-t border-border/50 bg-card">
              <h3 className="font-bold text-foreground text-lg truncate" title={item.title}>
                {item.title}
              </h3>
            </div>
            
            {showEditActions && (
              <div className="absolute top-2 right-2 z-20">
                <a 
                  href={`/member/portfolio/edit/${item.id}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-background/80 backdrop-blur border border-border text-primary rounded-full hover:bg-primary hover:text-primary-foreground shadow-sm transition-all inline-block"
                  title="Edit Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <h2 className="text-2xl font-black text-foreground">{selectedItem.title}</h2>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-background rounded-full transition-colors shrink-0"
              >
                <X className="w-6 h-6 text-foreground/60" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-8">
              {selectedItem.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-border bg-black/5">
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full max-h-[60vh] object-contain" />
                </div>
              )}

              {selectedItem.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-bold mb-2">Project Description</h3>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {selectedItem.description}
                  </p>
                </div>
              )}

              {selectedItem.fileUrl && (
                <div className="pt-6 border-t border-border">
                  <a 
                    href={selectedItem.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Attached File / Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
