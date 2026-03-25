import { useCallback, useEffect, useRef, useState } from 'react'

const useScrollToBottom = () => {
  const containerRef = useRef<HTMLDivElement>(null),
    endRef = useRef<HTMLDivElement>(null),
    [isAtBottom, setIsAtBottom] = useState(true),
    isAtBottomRef = useRef(true),
    isUserScrollingRef = useRef(false)

  useEffect(() => {
    isAtBottomRef.current = isAtBottom
  }, [isAtBottom])

  const checkIfAtBottom = useCallback(() => {
      if (!containerRef.current) return true
      const { clientHeight, scrollHeight, scrollTop } = containerRef.current
      return scrollTop + clientHeight >= scrollHeight - 100
    }, []),
    scrollToBottom = useCallback((behavior: ScrollBehavior) => {
      if (!containerRef.current) return
      containerRef.current.scrollTo({
        behavior,
        top: containerRef.current.scrollHeight
      })
    }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scrollTimeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      isUserScrollingRef.current = true
      clearTimeout(scrollTimeout)
      const atBottom = checkIfAtBottom()
      setIsAtBottom(atBottom)
      isAtBottomRef.current = atBottom
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false
      }, 150)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [checkIfAtBottom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scrollIfNeeded = () => {
        if (isAtBottomRef.current && !isUserScrollingRef.current)
          requestAnimationFrame(() => {
            container.scrollTo({
              behavior: 'instant',
              top: container.scrollHeight
            })
            setIsAtBottom(true)
            isAtBottomRef.current = true
          })
      },
      mutationObserver = new MutationObserver(scrollIfNeeded)
    mutationObserver.observe(container, {
      characterData: true,
      childList: true,
      subtree: true
    })
    const resizeObserver = new ResizeObserver(scrollIfNeeded)
    resizeObserver.observe(container)

    for (const child of container.children) resizeObserver.observe(child)
    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [])

  const onViewportEnter = () => {
      setIsAtBottom(true)
      isAtBottomRef.current = true
    },
    onViewportLeave = () => {
      setIsAtBottom(false)
      isAtBottomRef.current = false
    }
  return { containerRef, endRef, isAtBottom, onViewportEnter, onViewportLeave, scrollToBottom }
}

export default useScrollToBottom
