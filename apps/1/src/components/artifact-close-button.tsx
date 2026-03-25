import { Button } from '@a/ui/button'
import { X } from 'lucide-react'
import { memo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { initialArtifactData, useArtifact } from '~/hooks/use-artifact'

const PureArtifactCloseButton = () => {
  const { setArtifact } = useArtifact(),
    handleClose = () => setArtifact(a => (a.status === 'streaming' ? { ...a, isVisible: false } : initialArtifactData))
  useHotkeys('escape', handleClose)
  return (
    <Button onClick={handleClose} size='icon' variant='ghost'>
      <X />
    </Button>
  )
}

export default memo(PureArtifactCloseButton, () => true)
