"use client"

import * as React from "react"
import { rateUser } from "@/app/actions/users"
import { Star } from "lucide-react"

export function AdminRatingForm({ userId, currentRating }: { userId: string, currentRating: number }) {
  const [rating, setRating] = React.useState(currentRating)
  const [saving, setSaving] = React.useState(false)

  const handleRate = async (newRating: number) => {
    setRating(newRating)
    setSaving(true)
    const res = await rateUser(userId, newRating)
    setSaving(false)
    if (!res.success) {
      alert(res.error)
      setRating(currentRating) // Revert on failure
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={saving}
            onClick={() => handleRate(star)}
            className="focus:outline-none disabled:opacity-50 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-foreground/20 hover:text-yellow-500/50"
              }`}
            />
          </button>
        ))}
      </div>
      {saving && <span className="text-[10px] text-foreground/50 mt-1">Saving...</span>}
    </div>
  )
}
