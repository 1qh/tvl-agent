'use client'

import type { DataUIPart } from 'ai'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import { createContext, use, useMemo, useState } from 'react'

import type { CustomUIDataTypes } from '~/types'

interface DataStreamContextValue {
  dataStream: Ds
  setDataStream: Dispatch<SetStateAction<Ds>>
}

// @ts-expect-error - x
type Ds = DataUIPart<CustomUIDataTypes>[]

const DataStreamContext = createContext<DataStreamContextValue | null>(null)

export const DataStreamProvider = ({ children }: { children: ReactNode }) => {
    const [dataStream, setDataStream] = useState<Ds>([]),
      value = useMemo(() => ({ dataStream, setDataStream }), [dataStream])
    return <DataStreamContext value={value}>{children}</DataStreamContext>
  },
  useDataStream = () => {
    const context = use(DataStreamContext)
    if (!context) throw new Error('useDataStream must be used within a DataStreamProvider')
    return context
  }
