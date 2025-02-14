import classNames from 'classnames';
import { nanoid } from 'nanoid';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import Tooltip from '../Tooltip';
import Icon from './Icon';
import * as styles from './index.module.scss';

type Props = {
  // eslint-disable-next-line react/boolean-prop-naming
  value: boolean;
  onChange: (value: boolean) => void;
  label?: ReactNode;
  // eslint-disable-next-line react/boolean-prop-naming
  disabled: boolean;
  className?: string;
  disabledTooltip?: ReactNode;
};

const Checkbox = ({ value, onChange, label, disabled, className, disabledTooltip }: Props) => {
  const [id, setId] = useState(nanoid());

  const tipRef = useRef<HTMLDivElement>(null);

  return (
    <div className={classNames(styles.checkbox, className)}>
      <input
        id={id}
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      {disabled && disabledTooltip && (
        <>
          <div ref={tipRef} className={styles.disabledMask} />
          <Tooltip anchorRef={tipRef} content={disabledTooltip} />
        </>
      )}
      <Icon className={styles.icon} />
      {label && <label htmlFor={id}>{label}</label>}
    </div>
  );
};

export default Checkbox;
