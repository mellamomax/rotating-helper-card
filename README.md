# Rotating Helper Card

A custom Home Assistant card to show and set helper input-number in a circle slider.
You can also toggle an automation by clicking the center of the card.

Usefull for easy adjusting timers for automations triggered by motion sensors.

## Installation

Open HACS >
1. Go to any of the sections (integrations, frontend, automation).
2. Click on the 3 dots in the top right corner.
3. Select "Custom repositories"
4. Add the URL to the repository. ("https://github.com/mellamomax/rotating-helper-card")
5. Select the "lovelace"
6. Click the "ADD" button.

![image](https://github.com/user-attachments/assets/0e31ca73-d964-477b-9eb9-a65d2018ccfb)
![image](https://github.com/user-attachments/assets/d6287799-2b56-49b9-9c3b-1815c257feb3)

Example yaml:
```
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
```

Options:
| **Name**          | **Type**  | **Default** | **Supported options**       | **Description**                |
|-------------------|-----------|-------------|-----------------------------|--------------------------------|
| type              | string    |             | custom:rotating-helper-card | The type of the card.          |
| entity            | string    |             | input_number.badrum_sensor  | The entity to track.           |
| automation        | string    |             | automations| Automation entity.             |
| stepSize          | integer   | 1           |                             | Step size for increment adjustments of the helper.     |
| maxValue          | integer   | 100         |                             | Maximum value setting. (wont override the helper max value)         |
| secondaryValue    | string    |             | text                         | Secondary value to display.    |
| onColor           | string    |             | css-color                        | Color when on.                 |
| offColor          | string    |             | css-color                         | Color when off.                |
| ringColor         | string    |             | css-color                      | Color of the ring.             |
| trackColor        | string    |             | css-color                       | Color of the track.            |

