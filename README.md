# Rotating Helper Card

A custom Home Assistant card to show and set helper input-number in a circle slider.

## Installation

1. Clone this repository into your `custom_components` directory.
2. Add the card from the UI


![image](https://github.com/user-attachments/assets/0e31ca73-d964-477b-9eb9-a65d2018ccfb)
![image](https://github.com/user-attachments/assets/d6287799-2b56-49b9-9c3b-1815c257feb3)

Example yaml:

type: custom:rotating-helper-card
entity: input_number.badrum_sensor
stepSize: 15
maxValue: 20
secondaryValue: sec
onColor: blue
offColor: red
ringColor: orange
trackColor: green
automation: automation.badrum_sensor_2_0
