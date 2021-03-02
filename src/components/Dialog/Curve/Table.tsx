/* eslint-disable react/no-array-index-key */

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Button,
  InputNumber,
  Modal,
  Popover,
  Space,
} from 'antd';
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import TableDragSelect from 'react-table-drag-select';
import {
  isDecrement,
  isEscape,
  isIncrement,
  isReplace,
} from '../../../utils/keyboard/shortcuts';

type AxisType = 'x' | 'y';
type CellsType = boolean[][];
type DataType = number[][];
type OnChangeType = (data: DataType) => void;
enum Operations {
  INC,
  DEC,
  REPLACE,
}
type HslType = [number, number, number];

const Table = ({
  name,
  xLabel,
  yLabel,
  xData,
  yData,
  disabled,
  onChange,
  xUnits = '',
  yUnits = '',
}: {
  name: string,
  xLabel: string,
  yLabel: string,
  xData: number[],
  yData: number[],
  disabled: boolean,
  onChange: OnChangeType,
  xUnits?: string,
  yUnits?: string,
}) => {
  const titleProps = { disabled: true };
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalValue, setModalValue] = useState<number | undefined>();
  const [data, _setData] = useState<DataType>([yData, xData]);
  // data starts from `1` index, 0 is title / name
  const rowsCount = data[1].length + 1;
  const generateCells = () => [
    Array(rowsCount).fill(false),
    Array(rowsCount).fill(false),
  ];
  const [cells, _setCells] = useState<CellsType>(generateCells());
  const cellsRef = useRef(cells);
  const dataRef = useRef(data);
  const setCells = (currentCells: CellsType) => {
    cellsRef.current = currentCells;
    _setCells(currentCells);
  };
  const setData = (currentData: DataType) => {
    dataRef.current = currentData;
    _setData(currentData);
    onChange(currentData);
  };
  const modifyData = (operation: Operations, currentCells: CellsType, currentData: DataType, value = 0): DataType => {
    const newData = [...currentData.map((row) => [...row])];

    currentCells.forEach((_, rowIndex) => {
      currentCells[rowIndex].forEach((selected, valueIndex) => {
        if (!selected) {
          return;
        }

        switch (operation) {
          case Operations.INC:
            newData[rowIndex][valueIndex - 1] += 1;
            break;
          case Operations.DEC:
            newData[rowIndex][valueIndex - 1] -= 1;
            break;
          case Operations.REPLACE:
            newData[rowIndex][valueIndex - 1] = value || 0;
            break;
          default:
            break;
        }
      });
    });

    return [...newData];
  };
  const oneModalOk = () => {
    setData(modifyData(Operations.REPLACE, cellsRef.current, dataRef.current, modalValue));
    setIsModalVisible(false);
    setModalValue(undefined);
  };
  const onModalCancel = () => {
    setIsModalVisible(false);
    setModalValue(undefined);
  };
  const increment = () => setData(modifyData(Operations.INC, cellsRef.current, dataRef.current));
  const decrement = () => setData(modifyData(Operations.DEC, cellsRef.current, dataRef.current));
  const replace = () => {
    // don't show modal when no cell is selected
    if (cellsRef.current.flat().find((val) => val === true)) {
      setIsModalVisible(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isIncrement(e)) {
        increment();
      }
      if (isDecrement(e)) {
        decrement();
      }
      if (isReplace(e)) {
        replace();
      }
      if (isEscape(e)) {
        // clear out
        setCells(generateCells());
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorHsl = (min: number, max: number, value: number): HslType => {
    const saturation = 50;
    const lightness = 50;
    const coldDeg = 220;
    const hotDeg = 0;
    const remap = (x: number, inMin: number, inMax: number, outMin: number, outMax: number) => (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

    let hue = remap(value, min, max, coldDeg, hotDeg);

    // fallback to cold temp
    if (Number.isNaN(hue)) {
      hue = coldDeg;
    }

    return [hue, saturation, lightness];
  };

  const renderRow = (axis: AxisType, input: number[]) => input
    .map((value, index) => {
      const hsl = colorHsl(Math.min(...input), Math.max(...input), value);
      const [hue, sat, light] = hsl;

      return (
        <td
          className="value"
          key={`${axis}-${index}-${value}-${hsl.join('-')}`}
          style={{
            backgroundColor: `hsl(${hue}, ${sat}%, ${light}%)`,
          }}
        >
          {`${value}`}
        </td>
      );
    });

  return (
    <>
      <div className="table table-2d">
        <Popover
          visible={cells.flat().find((val) => val === true) === true}
          content={
            <Space>
              <Button onClick={decrement} icon={<MinusCircleOutlined />} />
              <Button onClick={increment} icon={<PlusCircleOutlined />} />
              <Button onClick={replace} icon={<EditOutlined />} />
            </Space>
          }
        >
          <TableDragSelect
            key={name}
            value={cells}
            onChange={setCells}
          >
            <tr>
              <td {...titleProps} className="title" key={yLabel}>{`${yLabel} (${yUnits})`}</td>
              {renderRow('y', data[0])}
            </tr>
            <tr>
              <td {...titleProps} className="title" key={xLabel}>{`${xLabel} (${xUnits})`}</td>
              {renderRow('x', data[1])}
            </tr>
          </TableDragSelect>
        </Popover>
      </div>
      <Modal
        title="Set cell values"
        visible={isModalVisible}
        onOk={oneModalOk}
        onCancel={onModalCancel}
      >
        <InputNumber
          // TODO: add validation
          value={modalValue}
          onChange={(val) => setModalValue(Number(val))}
          autoFocus
          onPressEnter={oneModalOk}
          style={{ width: '20%' }}
        />
      </Modal>
    </>
  );
};

export default Table;
