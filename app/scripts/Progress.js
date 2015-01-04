'use strict';

function progressState(message, percentDone) {
  this.message = message;
  this.percentDone = percentDone;
}

function bar(states, barTarget, messageTarget) {
    this.emptyStates = [ new progressState('Starting...', 0) ];

    this.states = this.emptyStates; // init with 0 state
    this.barView = $(barTarget);
    this.messageView = $(messageTarget);
    this.containerView = $('#loading');
    this.animationDuration = 100;
    this.currentStateIndex = 0;

    this.setProgress = function(state, message) {
      this.currentStateIndex = state;
      if (message) { currentMessage = message; }
      else { currentMessage = messages[stage]; }

      this.updateView();
    }

    this.setStates = function(newStates) {
      if ( states.constructor !== Array ) { throw "Error: progressBar.setStates(state) expects an array"; }
      var existingStates = this.emptyStates;
      // load the states into the array of states
      newStates.forEach(function(state) {
        existingStates.push(new progressState(state.message, state.percentDone));
      });
      existingStates.push(new progressState("Finished!", 100));
      this.states = existingStates;

      this.updateView();
    }


    this.increment = function() {
      if (this.currentStateIndex < this.states.length - 1) {
        this.currentStateIndex += 1;
        this.updateView();
      } else if (this.currentStateIndex == this.states.length - 1) {
        this.currentStateIndex += 1;
        console.log('finishing!');
        this.finish();
      } else {
        throw "Already on the last state!";
      }
    }

    this.start = function() {
      $('.progress-bar').width(0);
      this.containerView.show();
      this.increment();
    }

    this.reset = function() {
      this.currentStateIndex = 0;
    }

    this.finish = function() {
      this.currentStateIndex = this.states.length;
      this.message = "Finished loading!";

      this.updateView();
    }

    this.currentState = function() {
      try { return this.states[this.currentStateIndex]; }
      catch(err) { throw "Error: no progress bar state for index " + this.currentStateIndex }
    }

    this.currentMessage = function() {
      try { return this.currentState().message; }
      catch(err) { throw "Error: no progress bar message for state " + this.currentStateIndex }
    }

    this.currentPercentDone = function() {
      try { return this.currentState().percentDone + '%'; }
      catch(err) { throw "Error: no progress bar percentDone property for state " + this.currentStateIndex }
    }

    this.updateView = function() {
      this.barView.animate(
      { width: this.currentPercentDone() },
        100
      );

      var progressMessage = "Progress: " + this.currentPercentDone() + ' - ' + this.currentMessage();
      this.messageView.text(progressMessage);

      console.log(progressMessage);

      if (this.currentPercentDone() == '100%') {
        this.containerView.hide();
        this.currentStateIndex = 0;
      }



    }
    if (states) { this.setStates(states); }

}

exports.bar = bar;
