import { fetchingData, fetchingDataFinished, alert } from './CommonActions';
import { loadCases, loadUseCase, setCases, setUseCase, deleteUseCase } from '../services/TestService';

export const loadCaseList = () => async dispatch => {
    dispatch(fetchingData());
    try {
        let botKey = localStorage.getItem('botKey');
        let data = await loadCases(botKey);
        if (data.status === 'success') {
            dispatch({
                type: 'LOAD_CASES',
                data: data.resource
            });
        } else {
            dispatch({
                type: 'LOAD_CASES',
                data: {}
            });
        }
    }
    catch (e) {
        alert("Falha ao carregar casos de uso", "error");
    }
    finally {
        dispatch(fetchingDataFinished());
    }
};

export const selectCase = useCaseId => async dispatch => {
    dispatch(fetchingData());
    try {
        let botKey = localStorage.getItem('botKey');
        let data = await loadUseCase(botKey, useCaseId);
        let useCase = data.resource;
        useCase.testCases = JSON.parse(useCase.testCases);
        console.log(useCase);
        dispatch({
            type: 'SELECT_CASE',
            id: useCaseId,
            case: useCase
        });
    }
    catch (e) {
        alert('Falha ao carregar caso de uso', 'error');
    }
    finally {
        dispatch(fetchingDataFinished());
    }
}

export const newCase = (cases, bot) => async dispatch => {
    dispatch(fetchingData());
    try {
        let botKey = localStorage.getItem('botKey');
        let useCaseId = new Date().getTime();
        cases[useCaseId] = "Novo caso de uso";
        let useCase = {
            id: useCaseId,
            flowTitle: "Novo caso de uso",
            setUp: '[]',
            userVariables: {},
            testCases: [],
            aiScore: 6,
            error: '',
            botIdentity: bot.selected.shortName,
            botKey: bot.selected.authorization,
        }
        await setCases(botKey, cases);
        await setUseCase(botKey, useCase);
        dispatch({
            type: 'NEW_CASE',
            cases,
            useCase
        })
    }
    catch (e) {
        alert('Falha ao criar caso de uso', 'error');
    }
    finally {
        dispatch(fetchingDataFinished());
    }
}

export const saveCase = (useCase, cases) => async dispatch => {
    dispatch(fetchingData());
    try {
        let botKey = localStorage.getItem('botKey');
        let useCaseId = useCase.id;
        if (cases[useCaseId] !== useCase.flowTitle) {
            cases[useCaseId] = useCase.flowTitle;
            await setCases(botKey, cases);
        }
        await setUseCase(botKey, useCase);
        dispatch({
            type: 'SELECT_CASE',
            id: useCaseId,
            case: useCase
        });
    }
    catch (e) {
        alert('Falha ao salvar caso de uso', 'error');
    }
    finally {
        dispatch(fetchingDataFinished());
    }
}

export const deleteCase = (useCaseId, cases) => async dispatch => {
    dispatch(fetchingData());
    try {
        let botKey = localStorage.getItem('botKey');
        let data = await deleteUseCase(botKey, useCaseId);
        if (data.status === 'success') {
            delete cases[useCaseId];
            await setCases(botKey, cases);
            /* dispatch({
                type: 'RESET_ALL'
            }); */
        }
        else {
            alert('Falha ao excluir caso de uso', 'error');
        }
    }
    catch (e) {
        alert('Falha ao salvar caso de uso', 'error');
    }
    finally {
        dispatch(fetchingDataFinished());
    }
}

export const toggleTestQueue = (testCaseId, queue) => async dispatch => {
    let idx = queue.indexOf(testCaseId);
    if (idx !== -1) {
        dispatch({
            type: 'REMOVE_FROM_QUEUE',
            testCaseId
        })
    } else {
        dispatch({
            type: 'ADD_TO_QUEUE',
            testCaseId
        })
    };
}

export const setQueue = (queue) => async dispatch => {
    dispatch({
        type: 'SET_QUEUE',
        queue
    })
}

export const runTests = () => async dispatch => {
    dispatch({
        type: 'START_TESTING'
    });
}

export const finishTest = (testId, log) => dispatch => {
    let regex = /FAILED/;
    let testFailed = regex.test(log);
    dispatch({
        type: 'SET_LOG',
        testCaseId: testId,
        log: {
            value: log,
            status: testFailed ? 'fail' : 'success'
        }
    });
    dispatch({
        type: 'REMOVE_FROM_QUEUE',
        testCaseId: testId
    })
}