import { Table } from 'antd'
import type { TableColumnsType } from 'antd'

import type { DataTableProps } from '../types'

interface DataTableComponentProps {
  props: DataTableProps
}

type RowData = Record<string, string | number | boolean | null> & {
  __schemaRowKey: string
}

export function DataTable({ props }: DataTableComponentProps) {
  const columns: TableColumnsType<RowData> = props.columns.map((column) => ({
    title: column.title,
    dataIndex: column.dataIndex,
    width: column.width,
    ellipsis: true,
  }))
  const dataSource = props.data.map((row, index) => ({
    ...row,
    __schemaRowKey:
      typeof row.id === 'string' || typeof row.id === 'number'
        ? String(row.id)
        : String(index),
  }))
  const pagination =
    props.pagination === undefined
      ? false
      : typeof props.pagination === 'boolean'
        ? props.pagination
          ? { pageSize: 10 }
          : false
        : { pageSize: props.pagination.pageSize ?? 10 }

  return (
    <div className="min-w-0 [&_.ant-table]:text-sm [&_.ant-table-thead>tr>th]:font-medium">
      <Table<RowData>
        size="small"
        columns={columns}
        dataSource={dataSource}
        rowKey="__schemaRowKey"
        pagination={pagination}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
