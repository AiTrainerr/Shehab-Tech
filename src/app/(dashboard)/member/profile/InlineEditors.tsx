"use client"

import * as React from "react"
import { Plus, X, Loader2 } from "lucide-react"
import { addUserSkill, removeUserSkill, addUserLanguage, removeUserLanguage } from "@/app/actions/user"

export function InlineSkillManager({ 
  skills 
}: { 
  skills: { skill: { id: string, name: string } }[] 
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [skillName, setSkillName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skillName.trim()) return
    setIsSubmitting(true)
    const res = await addUserSkill(skillName)
    setIsSubmitting(false)
    if (res.success) {
      setSkillName("")
      setIsOpen(false)
    } else {
      alert(res.error || "Failed to add skill")
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this skill?")) return
    await removeUserSkill(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {skills.map(s => (
          <span key={s.skill.id} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-1 group">
            {s.skill.name}
            <button onClick={() => handleRemove(s.skill.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/20 rounded-full">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="px-3 py-1 bg-background border border-dashed border-border text-foreground/50 hover:text-primary hover:border-primary rounded-full text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Skill
          </button>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleAdd} className="flex gap-2 items-center bg-card p-2 rounded-xl border border-border">
          <input
            autoFocus
            type="text"
            value={skillName}
            onChange={e => setSkillName(e.target.value)}
            placeholder="e.g. JavaScript"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
            disabled={isSubmitting}
          />
          <button type="submit" disabled={!skillName.trim() || isSubmitting} className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="p-1.5 text-foreground/50 hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}

export function InlineLanguageManager({ 
  languages 
}: { 
  languages: { id: string, language: string, proficiency: string }[] 
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [language, setLanguage] = React.useState("")
  const [proficiency, setProficiency] = React.useState("Conversational")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!language.trim()) return
    setIsSubmitting(true)
    const res = await addUserLanguage(language, proficiency)
    setIsSubmitting(false)
    if (res.success) {
      setLanguage("")
      setProficiency("Conversational")
      setIsOpen(false)
    } else {
      alert(res.error || "Failed to add language")
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this language?")) return
    await removeUserLanguage(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        {languages.map(l => (
          <div key={l.id} className="flex items-center justify-between p-2 rounded-xl border border-border bg-card group">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{l.language}</span>
              <span className="text-xs text-foreground/50 px-2 py-0.5 rounded-full bg-background border border-border">{l.proficiency}</span>
            </div>
            <button onClick={() => handleRemove(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full px-3 py-2 bg-background border border-dashed border-border text-foreground/50 hover:text-primary hover:border-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Language
          </button>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border">
          <input
            autoFocus
            type="text"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            placeholder="Language (e.g. English)"
            className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
            disabled={isSubmitting}
          />
          <select
            value={proficiency}
            onChange={e => setProficiency(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary appearance-none"
            disabled={isSubmitting}
          >
            <option>Basic</option>
            <option>Conversational</option>
            <option>Fluent</option>
            <option>Native or Bilingual</option>
          </select>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={!language.trim() || isSubmitting} className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-background text-foreground/70 text-sm font-bold border border-border rounded-lg hover:bg-card">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
