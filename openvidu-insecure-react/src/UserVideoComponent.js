import React, { Component } from 'react';
import './UserVideo.css';
import OpenViduVideoComponent from './OvVideo';

export default class UserVideoComponent extends Component {
    constructor(props) {
        super(props);

        this.handleVideoClicked = this.handleVideoClicked.bind(this);
    }

    getNicknameTag() {
        // Gets the nickName of the user
        return JSON.parse(this.props.streamManager.stream.connection.data).clientData;
    }

    handleVideoClicked(event) {
        // Triggers event for the parent component to update its main video display (other UserVideoComponent)
        if (this.props.mainVideoStream) {
            this.props.mainVideoStream(this.props.streamManager);
        }
    }

    render() {
        return (
            <div>
                {this.props.streamManager !== undefined ? (
                    <div className="streamcomponent" onClick={this.handleVideoClicked}>
                        <OpenViduVideoComponent streamManager={this.props.streamManager} />
                        <div>
                            <p>{this.getNicknameTag()}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}
