import { Component, OnInit, ViewChild } from '@angular/core';
import { bridgeService } from '../services/bridge.service';
import { EndpointsService } from '../services/endpoints.service';

import { MatStepper, StepperOrientation } from '@angular/material/stepper';
import { EquipmentSearch, Location, DwellingInfo, SystemDesign } from '../models/rebate-finder-inputs';
import { error } from '@angular/compiler/src/util';

@Component({
  selector: 'app-rebate-finder',
  templateUrl: './rebate-finder.component.html',
  styleUrls: ['./rebate-finder.component.css']
})

export class RebateFinderComponent implements OnInit {
  @ViewChild('stepper')
  stepper!: MatStepper;

  // local variables save data of stepper
  myData =  new EquipmentSearch();
  myResults!: any[];  
  showProducLines: boolean = false;
  master = 'Master';
  productLineSystemDesign!: SystemDesign;
  inLastStep: boolean = false;
  myButtonStatus: {[key: string]: boolean }= {};

  disableButton: boolean = false;

  constructor(
    public _bridge: bridgeService,
    private _endpoint: EndpointsService
  ) { }

  ngOnInit(): void {
   
    this._bridge.HVACInputs.subscribe((payload: any) => {
      let myStepName:string = payload.data[1]
      let myStepPayload:any = payload.data[0]
      this.myButtonStatus[myStepName] = true;//this.ActiveContinuebutton(payload.data[0]);
      this.myData[myStepName as keyof EquipmentSearch] = myStepPayload;
      console.log(payload);
      if(this.inLastStep) {
        this.callSearch()
      }
    });
  }

  //
  ActiveContinuebutton(input:any): boolean{

    Object.keys(input).forEach(key => {
        if (input[key] == null || input[key] == undefined || input[key] === '') {
            this.disableButton = false
        } else {
            this.disableButton = true
        }
        if (typeof input[key] === 'object' && input[key] !== null) {
            this.ActiveContinuebutton(input[key])
        }
    })

    return this.disableButton;
  }

 

  // tabChange is a callback when the progress bar step is changed.
  // If the new step is the final step in sequence, we load the equipment search results.
  tabChange(e:any){
  
    // If this is the last step in sequence, load the results (ahri combinations).
    if(this.stepper?.steps.length -1 == e.selectedIndex) {
      this.inLastStep = true;
      
      // If system design inputs are empty, show product line menu and select the first available option.
      // Selecting a product line effectively completes the system design attributes.
      if (!this.myData.systemDesign) {
        this.showProducLines = true;
      }

      // First call the eligibility questions and requirements endpoint to get the default values for this search.
      // Then call the results endpoint with the complete payload.
      this._endpoint.ElegibilityCriteria(this.myData).subscribe({
	      next: (resp:any) => {
          
          // sent payload to component to render  eligibility questions and criteria 
          //QuestionsRequirements component sends default values received from server
          this._bridge.paramsQuestionsRequirements.emit({
            data: resp
          });

          // Load the results (ahri combinations).
          this.callSearch();

	      },
        error: (err2:Error) => alert(err2.message)
	    });

    } else{
        this.inLastStep = false;
    } 

  }

  callSearch() {
    console.log("call search", this.myData);
    this._endpoint.Search(this.myData).subscribe({
      next: (respSearch:any) => {
        // TODO: Order results and render cards.
        
        this.myResults = respSearch
        
      },
      error: (err1:Error) => alert(err1.message)
    })
  }
 

}
