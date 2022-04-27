# NodeAV_Implementation
This is a course project for Software and Data Engineering course (2022).<br/>
This tool can be used to detect atomicity violations in nodejs application. It first
generates an execution trace of application with async_hooks and njstrace to get information
about asynchronous events. Then using defined rules, a happens-before graph is created among events by using the execution trace. Then from the graph we can see the events which violate atomicity constraint. <br/>
Reference paper: https://ieeexplore.ieee.org/document/8811949 <br/>
Third party library used: https://github.com/ValYouW/njsTrace <br/>

To run the code:

After downloading the code and moving to the project folder:
Run the following to install dependencies:

`$ npm install`


In order to run the tool:

1. Put a nodejs file in to_test folder along with its dependencies.

2. If the file to be investigated is test.js, then in order to generate logs: <br/>
    `$ node index.js log node ./to_test/test.js`

3. In order to generate happens before graph from json file generated in previous step, use the following command. <br/>

    `$ node index.js hb log/'folder_name_where_log_created'/filename.log.json -i`

The result can be viewed in the location log/folder_name_where_log_created as json files and images.


## Collaborators
| Name              | Year          |Role   |
| ----------------- |:-------------|:----------|
|[Bhawna Chopra ](https://github.com/bhawnachopra2002)|Sophomore|Develepor|
|[Darsh Patel](https://github.com/patel-16)|Sophomore|Develepor|
