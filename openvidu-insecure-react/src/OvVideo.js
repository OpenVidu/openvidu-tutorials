import React, { Component } from 'react';

export default class OpenViduVideoComponent extends Component {
    constructor(props) {
        super(props);

        console.log(props);

        this.videoRef = React.createRef();
    }

    /*componentWillReceiveProps(props) {
        if (props && !!this.videoRef) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }*/

    componentDidMount() {
        if (this.props && !!this.videoRef) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }

    render() {
        return <video autoPlay={true} ref={this.videoRef} />;
    }
}
