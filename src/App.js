import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';
import ArrowDownWard from 'material-ui/svg-icons/navigation/arrow-downward';
import ArrowUpWard from 'material-ui/svg-icons/navigation/arrow-upward';
import orderBy from 'lodash/orderBy';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import moment from 'moment';

// Server url and end points
const SERVER_URL = "http://localhost:8081/";
const SIGHTINGS = "sightings";
const SPECIES = "species";

const ERROR_TEXTS = {
    date: 'A valid date must be given',
    time: 'A valid time must be given',
    species: 'Invalid species',
    description: 'Description cannot be empty',
    count: 'Count must be a valid number higher than 0'
};

class App extends Component {
    render() {
        return (
            <MuiThemeProvider>
                <div className="App">
                    <DuckTable />
                </div>
            </MuiThemeProvider>
        );
    }
}

class DuckTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            ducks : [],
            sortColumn: "ID",
            sortDir: true,
        };
    }

    componentDidMount = () => {
        this.fetchSightings();
    };

    fetchSightings = () => {
        axios.get(SERVER_URL + SIGHTINGS).then(response => {
            let ducks = response.data.map((duck) => {
                return {
                    id: parseInt(duck.id, 10),
                    datetime: new Date(duck.dateTime),
                    description: duck.description,
                    species: duck.species,
                    count: parseInt(duck.count, 10)
                }
            });
            this.setState({ ducks: ducks });
        }).catch((error) => {
            console.log(error);
        });
    };

    sortDataBy = (columnName) => {
        if (columnName === undefined) { return; }

        let sortDir = this.state.sortColumn === columnName ?  !this.state.sortDir : true;

        let ducks = orderBy(this.state.ducks, [columnName.toLowerCase()], [sortDir ? 'asc' : 'desc']);
        this.setState({ ducks: ducks, sortDir: sortDir, sortColumn: columnName});
    };

    render() {
        let arrow = this.state.sortDir ? (<ArrowUpWard/>) : (<ArrowDownWard/>);
        let tableStyle = {wordWrap: 'break-word', whiteSpace: 'normal'};

        return (
            <div>
                <Table>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow onCellClick={(event) => (this.sortDataBy(event.target.innerText))}>
                            <TableHeaderColumn className="noselect">{this.state.sortColumn === "ID" && arrow}ID</TableHeaderColumn>
                            <TableHeaderColumn className="noselect">{this.state.sortColumn === "DateTime" && arrow}DateTime</TableHeaderColumn>
                            <TableHeaderColumn className="noselect">{this.state.sortColumn === "Species" && arrow}Species</TableHeaderColumn>
                            <TableHeaderColumn className="noselect">{this.state.sortColumn === "Description" && arrow}Description</TableHeaderColumn>
                            <TableHeaderColumn className="noselect">{this.state.sortColumn === "Count" && arrow}Count</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.state.ducks.map(duck =>
                            <TableRow key={duck.id}>
                                <TableRowColumn style={tableStyle}>{duck.id}</TableRowColumn>
                                <TableRowColumn style={tableStyle}>{duck.datetime.toLocaleString()}</TableRowColumn>
                                <TableRowColumn style={tableStyle}>{duck.species}</TableRowColumn>
                                <TableRowColumn style={tableStyle}>{duck.description}</TableRowColumn>
                                <TableRowColumn style={tableStyle}>{duck.count}</TableRowColumn>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <DuckDialogButton fetchSightings={ this.fetchSightings } />
            </div>
        );
    }
}

class DuckDialogButton extends Component {

    constructor(props) {
        super(props);
        this.state = {
            open : false,
            date: "",
            time: "",
            selSpecies: "",
            description: "",
            species: [],
            count: 1,
            errors: {}
        };
    }

    componentDidMount = () => {
        axios.get(SERVER_URL + SPECIES).then(response => {
            let species = response.data.map((species) => {
                return species['name'];
            });
            if (species.length > 0) {
                this.setState({species: species, selSpecies: species[0]});
            } else {
                this.setState({species: species})
            }
        }).catch((error) => {
            console.log(error.response);
        });
    };

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleDateChange = (event, date) => {
        this.setState({
            date: this.formatDate(date),
        });
    };

    handleTimeChange = (event, date) => {
        this.setState({
            time: this.formatTime(date),
        });
    };

    handleSpeciesChange = (event, i) => {
        this.setState({
            selSpecies: this.state.species[i]
        });
    };

    handleDescChange = (event, desc) => {
        this.setState({
            description: desc
        });
    };

    handleCountChange = (event, n) => {
        this.setState({
            count: n
        });
    };

    formatDate = (date) => {
        return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
    };
    formatTime = (date) => {
        return date.getHours() + ":" + date.getMinutes();
    };

    handleSubmit = () => {
        let errors = {};

        (this.state.date === '') ? errors.date = ERROR_TEXTS.date : delete errors.date;

        (this.state.time === '') ? errors.time = ERROR_TEXTS.time : delete errors.time;

        (!this.state.species.includes(this.state.selSpecies)) ? errors.species = ERROR_TEXTS.species : delete errors.species;

        (this.state.description === '') ? errors.description = ERROR_TEXTS.description : delete errors.description;

        (this.state.count < 1 || isNaN(this.state.count)) ? errors.count = ERROR_TEXTS.count : delete errors.count;

        this.setState({
            errors: errors
        }, () => {
            if (Object.keys(this.state.errors).length === 0) {
                this.submitNewSighting();
            }
        });
    };

    submitNewSighting = () => {
        let datetime = moment(this.state.date + "|" + this.state.time, "DD.MM.YYYY|HH:mm").toISOString();

        let sighting = {
            species: this.state.selSpecies,
            description: this.state.description,
            dateTime: datetime,
            count: this.state.count
        };

        axios.post(SERVER_URL + SIGHTINGS, sighting).then((response) => {
            // Reset the state
            this.setState({
                selSpecies: this.state.species[0],
                date: "",
                time: "",
                description: "",
                count: 1,
                open: false
            });
            // Refetch the sightings from the server
            this.props.fetchSightings();
        }).catch((error) => {
            console.log(error.response);
        });


    };

    render() {
        const style = {
            margin: 0,
            top: 'auto',
            right: 20,
            bottom: 20,
            left: 'auto',
            position: 'fixed',
        };

        const actions = [
            <FlatButton label="Cancel" primary={false} onClick={this.handleClose} />,
            <FlatButton label="Submit" primary={true} onClick={this.handleSubmit} />,
        ];

        return (
            <div>
                <FloatingActionButton style={style} onClick={this.handleOpen}><ContentAdd/></FloatingActionButton>
                <Dialog
                    title="Add new sighting"
                    actions={actions}
                    modal={true}
                    open={this.state.open}
                >
                    <DatePicker
                        floatingLabelText="Date of sighting"
                        formatDate={this.formatDate}
                        onChange={this.handleDateChange}
                        errorText={this.state.errors.date ? this.state.errors.date : ''}
                    />
                    <TimePicker
                        floatingLabelText="Time of sighting"
                        format="24hr"
                        onChange={this.handleTimeChange}
                        errorText={this.state.errors.time ? this.state.errors.time : ''}
                    />
                    <SelectField
                        floatingLabelText="Species"
                        value={this.state.selSpecies}
                        onChange={this.handleSpeciesChange}
                        errorText={this.state.errors.species ? this.state.errors.species : ''}
                    >
                        {this.state.species.map((specie) =>
                            <MenuItem value={specie} key={specie} primaryText={specie} />
                        )}
                    </SelectField><br/>
                    <TextField
                        floatingLabelText="Description"
                        multiLine={true}
                        value={this.state.description}
                        onChange={this.handleDescChange}
                        errorText={this.state.errors.description ? this.state.errors.description : ''}
                    /><br/>
                    <TextField
                        floatingLabelText="Count"
                        type="number"
                        value={this.state.count}
                        onChange={this.handleCountChange}
                        errorText={this.state.errors.count ? this.state.errors.count : ''}
                    />
                </Dialog>
            </div>
        );
    }
}

export default App;
