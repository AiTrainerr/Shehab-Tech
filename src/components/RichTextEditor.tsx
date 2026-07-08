"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import * as React from "react";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse bg-muted/50 rounded-xl"></div> });

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, name }: Props) {
  const modules = React.useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'direction': 'rtl' }], // text direction
      [{ 'align': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  }), []);

  const formats = [
    'header',
    'size',
    'direction',
    'align',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'blockquote', 'code-block'
  ];

  return (
    <div className="bg-background rounded-xl overflow-hidden border border-border [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-toolbar]:bg-muted/30 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:max-h-[500px] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:text-base [&_.ql-editor]:text-foreground [&_.ql-editor]:font-sans [&_.ql-blank::before]:text-foreground/40 [&_.ql-picker-options]:bg-background [&_.ql-picker-options]:border-border [&_.ql-picker-options]:text-foreground [&_.ql-picker-item]:text-foreground hover:[&_.ql-picker-item]:text-primary">
      {/* Hidden input to allow native form submission to pick up the value */}
      {name && <input type="hidden" name={name} value={value} />}
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
