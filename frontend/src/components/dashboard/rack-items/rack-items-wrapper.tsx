"use client"

import { useState } from "react"
import { RackItemsTable } from "@/components/dashboard/rack-items/rack-items-table"
import type { Item } from "@/components/dashboard/types"

interface RackItemsWrapperProps {
  initialItems: Item[]
}

export function RackItemsWrapper({ initialItems }: RackItemsWrapperProps) {
  const [items, setItems] = useState<Item[]>(initialItems)

  const handleEdit = (item: Item) => {
    console.log("Edit item:", item)
  }

  const handleDelete = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
    console.log("Deleted item:", itemId)

    // setItems(initialItems)
    // console.log(" Reset items to initial state")
  }

  const handleViewDetails = (item: Item) => {
    console.log("View details:", item)
  }

  return (
    <RackItemsTable
      items={items}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onViewDetails={handleViewDetails}
    />
  )
}
