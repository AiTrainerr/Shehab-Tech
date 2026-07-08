"use client";

import * as React from "react";

export function RichTextDisplay({ content, className = "" }: { content: string, className?: string }) {
  if (!content) return null;
  
  // Replace non-breaking spaces with normal spaces to allow browser word-wrapping
  const wrapSafeContent = content.replace(/&nbsp;/g, ' ');
  
  return (
    <div 
      className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap
        [&>p]:mb-4 [&>p:last-child]:mb-0 
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul]:mt-2
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol]:mt-2
        [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
        [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5
        [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-4
        [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-foreground/80
        [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
        ${className}`}
      dangerouslySetInnerHTML={{ __html: wrapSafeContent }}
    />
  );
}

export function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
