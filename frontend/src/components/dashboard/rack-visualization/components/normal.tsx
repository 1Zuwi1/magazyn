import { memo } from "react"
import type { ItemSlot } from "../../types"
import { getSlotCoordinate } from "../../utils/helpers"
import RackElement from "../rack-element"

const Normal = ({
  cols,
  rows,
  containerWidth,
  containerHeight,
  items,
}: {
  cols: number
  rows: number
  containerWidth: number
  containerHeight: number
  items: ItemSlot[]
}) => {
  const totalSlots = rows * cols

  return (
    <div
      className="p-2 sm:p-4"
      style={{
        width: `${containerWidth}px`,
        maxHeight: `${containerHeight}px`,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        className="grid gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalSlots }).map((_, index) => {
          const item = items[index]
          const isEmpty = !item
          const coordinate = getSlotCoordinate(index, cols)

          return (
            <RackElement
              coordinate={coordinate}
              isEmpty={isEmpty}
              item={item}
              key={index}
            />
          )
        })}
      </div>
    </div>
  )
}
Normal.displayName = "Normal"

export default memo(Normal)
