import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import FlowDisplay from '../../../components/FlowDisplay';
import Properties from '../../../components/Properties';
import Block from '../../../components/Block';
import Config from '../../../components/Config';
import Modal from '../../../components/Modal';
import { saveCase, deleteCase } from '../../../actions/TestActions'

import ReactDragList from 'react-drag-list'

import { debounceCall } from '../../../helpers/commonHelper';

const mapStateToProps = state => ({
    ...state,
});

const mapDispatchToProps = dispatch => ({
    saveCase: (useCase, cases) => dispatch(saveCase(useCase, cases)),
    deleteCase: (useCaseId, cases) => dispatch(deleteCase(useCaseId, cases)),
});

const guid = () => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

const grid = {
    display: 'grid',
    gridTemplateColumns: '50% auto',
    gridTemplateAreas: '"flow properties"',
};

const flow = {
    gridArea: 'flow',
};

const properties = {
    gridArea: 'properties',
};

class Testing extends Component {
    constructor() {
        super();
        this.state = {
            flowTitle: 'Novo Fluxo',
            setUp: '[]',
            userVariables: {},
            blocks: [],
            selected: '',
            showModal: true,
            aiScore: 6,
            error: '',
            id: ''
        };
        this.addBlock.bind(this);
        this.deleteBlock.bind(this);
        this.selectBlock.bind(this);
        this.setBlock.bind(this);
        this.toggleConfigurations.bind(this);
        this.setConfig.bind(this);
    }

    setTitle = newTitle => {
        this.setState({
            flowTitle: newTitle,
        });
    };

    setConfig = (configKey, configValue) => {
        this.setState({
            [configKey]: configValue,
        });
    };

    clearFlow = () => {
        if (window.confirm('Tem certeza que deseja limpar o fluxo?')) {
            this.setState({
                flowTitle: 'Novo Fluxo',
                setUp: '[]',
                userVariables: {},
                blocks: [],
                selected: '',
                showModal: true,
                aiScore: 6,
            });
        }
    };

    addBlock = block => {
        block.id = guid();
        this.setState(prevState => ({
            blocks: [...prevState.blocks, block],
        }));
    };

    deleteBlock = index => {
        if (index === this.state.selected) {
            this.setState({ selected: '' });
        }
        this.setState(prevState => {
            const blocks = prevState.blocks;
            blocks.splice(index, 1);
            return { blocks };
        });
    };

    selectBlock = index => {
        this.setState({
            selected: index,
        });
    };

    setBlock = block => {
        const newBlocks = [...this.state.blocks];
        newBlocks[this.state.selected] = block;
        this.setState(
            {
                blocks: newBlocks,
            },
            this.selectBlock(this.state.selected),
        );
    };

    downloadJson = () => {
        let json = {
            botIdentity: this.props.bot.selected.shortName,
            botKey: this.props.bot.selected.authorization,
            setUp: JSON.stringify(JSON.parse(this.state.setUp)),
            userVariables: this.state.userVariables,
            testCases: JSON.stringify(this.state.blocks),
            aiScore: Number(this.state.aiScore),
        };

        const blob = new Blob([JSON.stringify(json)], { type: 'text/json' });

        let e = document.createEvent('MouseEvents');

        const a = document.createElement('a');

        a.download = `${this.state.flowTitle}.json`;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent(
            'click',
            true,
            false,
            window,
            0,
            0,
            0,
            0,
            0,
            false,
            false,
            false,
            false,
            0,
            null,
        );
        a.dispatchEvent(e);
    };

    uploadJson = (json, title) => {
        try {
            this.setState({
                setUp: json.setUp,
                userVariables: json.userVariables,
                blocks: JSON.parse(json.testCases),
                aiScore: JSON.parse(json.aiScore),
                flowTitle: title
            });
        } catch (error) {
            this.setState({
                error: 'Arquivo JSON incompatível!',
            });
        }
    };

    componentDidMount() {
        let { test } = this.props;
        if (test.selectedCase) {
            this.setState(test.selectedCase);
        }
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.state.id && nextState !== this.state && nextState.id === this.state.id) {
            debounceCall(this.props.saveCase(nextState, this.props.test.cases), 250);
        }
    }

    componentWillReceiveProps(newProps) {
        let { test } = this.props;
        if (newProps.test.selectedId !== test.selectedId) {
            this.setState(newProps.test.selectedCase);
        }
    }

    toggleConfigurations = () => {
        /*
        if ((!this.state.botIdentity || !this.state.botKey) && this.state.showModal) {
            return false;
        } else { */
        this.setState(prevState => ({
            showModal: !prevState.showModal,
        }));
        return true;
        /* } */
    };

    render() {
        let { blocks } = this.state;
        let { bot, deleteCase, test } = this.props;
        return (
            <div style={grid}>
                {
                    this.props.test.selectedId ?
                        <React.Fragment>
                            <FlowDisplay
                                style={flow}
                                flowTitle={this.state.flowTitle}
                                setTitle={this.setTitle.bind(this)}
                                addBlock={this.addBlock}
                                download={this.downloadJson}
                                uploadJson={this.uploadJson}
                                clearFlow={this.clearFlow}
                                openConfig={this.toggleConfigurations}
                                delete={() => window.confirm('Tem certeza que deseja excluir esse caso de uso?') && deleteCase(test.selectedId, test.cases)}
                            >
                                <ReactCSSTransitionGroup
                                    transitionName="blocks"
                                    transitionEnterTimeout={200}
                                    transitionLeaveTimeout={200}
                                >
                                    <ReactDragList
                                        className="Blocks"
                                        rowClassName="BlockItem"
                                        dragClass="dragging"
                                        ghostClass="drop"
                                        dataSource={blocks}
                                        row={(block, index) => <Block
                                            selected={index === this.state.selected}
                                            block={block}
                                            onClick={() => this.selectBlock(index)}
                                            key={block.id}
                                            deleteBlock={e => {
                                                e.stopPropagation();
                                                this.deleteBlock(index);
                                            }}
                                        />}
                                    />
                                    {/* this.state.blocks.map((block, index) => (
                                        <Block
                                            draggable='true'
                                            selected={index === this.state.selected}
                                            block={block}
                                            onClick={() => this.selectBlock(index)}
                                            key={block.id}
                                            deleteBlock={e => {
                                                e.stopPropagation();
                                                this.deleteBlock(index);
                                            }}
                                        />
                                    )) */}
                                </ReactCSSTransitionGroup>
                            </FlowDisplay>
                            <Properties
                                style={properties}
                                {...this.state.blocks[this.state.selected]}
                                setBlock={this.setBlock}
                                selected={this.state.selected}
                                intents={bot.selected.intents}
                                entities={bot.selected.entities}
                            />
                            <Config
                                show={this.state.showModal}
                                close={this.toggleConfigurations}
                                setConfig={this.setConfig}
                                parameters={this.state}
                            />
                            <Modal
                                show={this.state.error}
                                close={() => {
                                    this.setState({ error: '' });
                                }}
                                title={this.state.error}
                            />
                        </React.Fragment>
                        :
                        <p>Selecione um caso de uso</p>

                }
            </div>
        );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Testing);
