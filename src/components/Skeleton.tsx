type Props = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...rest }: Props) {
  return (
    <div
      className={`bg-mute animate-pulse rounded-md ${className ?? ""}`}
      aria-hidden
      {...rest}
    />
  )
}
