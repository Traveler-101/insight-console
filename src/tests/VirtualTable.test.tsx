import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualTable, type Column } from '@/components/table/VirtualTable';

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = Array.from({ length: 10000 }, (_, index) => ({
  id: `SO${index}`,
  name: `客户 ${index}`,
  amount: index * 10,
}));

const columns: Column<Row>[] = [
  { key: 'id', label: '订单号', width: '1fr', render: (row) => row.id },
  { key: 'name', label: '客户', width: '1fr', render: (row) => row.name },
];

describe('VirtualTable', () => {
  it('1 万行数据只渲染可视区域内的行', () => {
    const { container } = render(
      <VirtualTable rows={rows} columns={columns} rowKey={(row) => row.id} height={480} />,
    );

    const rendered = container.querySelectorAll('.vtable-row');
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(40);
    expect(screen.getByText('订单号')).toBeInTheDocument();
    expect(screen.getByText('SO0')).toBeInTheDocument();
  });

  it('空数据展示占位内容', () => {
    render(
      <VirtualTable
        rows={[]}
        columns={columns}
        rowKey={(row) => row.id}
        empty="暂无订单"
      />,
    );
    expect(screen.getByText('暂无订单')).toBeInTheDocument();
  });
});
