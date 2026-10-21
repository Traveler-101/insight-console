import { describe, expect, it } from 'vitest';
import { toCsv } from '@/utils/csv';

describe('toCsv', () => {
  it('按列顺序输出并转义特殊字符', () => {
    const csv = toCsv(
      [
        { id: 'A1', name: '张三, 北京', note: '他说"你好"' },
        { id: 'A2', name: '李四', note: '换行\n内容' },
      ],
      [
        { key: 'id', label: '编号' },
        { key: 'name', label: '姓名' },
        { key: 'note', label: '备注' },
      ],
    );

    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('编号,姓名,备注');
    expect(lines[1]).toBe('A1,"张三, 北京","他说""你好"""');
    expect(lines[2]).toBe('A2,李四,"换行\n内容"');
  });

  it('空值输出为空字符串', () => {
    const csv = toCsv([{ id: 'A1', remark: null }], [
      { key: 'id', label: '编号' },
      { key: 'remark', label: '备注' },
    ]);
    expect(csv.split('\r\n')[1]).toBe('A1,');
  });
});
