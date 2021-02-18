import { ComponentEx, Spinner } from "vortex-api";
import { WithTranslation, withTranslation } from 'react-i18next';

import * as React from 'react';


export interface IBaseProps {
    enabled?: boolean;
    size?: number;
}

type IProps = IBaseProps;

class LoadingSpinner extends React.Component<IProps, {}> {

    static defaultProps: IProps = {enabled: true};
    
    constructor(props: IProps) {
        super(props);

    }

    public render(): JSX.Element {
        var { enabled, size } = this.props;
        size ||= 64;
        return (
            enabled
                ?
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spinner
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                        }}
                    />
                </div>
                : <></>
        );
    }


}

export default LoadingSpinner;
