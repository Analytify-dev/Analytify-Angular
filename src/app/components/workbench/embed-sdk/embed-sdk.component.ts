import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/sharedmodule';
import { WorkbenchService } from '../workbench.service';

@Component({
  selector: 'app-embed-sdk',
  standalone: true,
  imports: [FormsModule,SharedModule, CommonModule],
  templateUrl: './embed-sdk.component.html',
  styleUrl: './embed-sdk.component.scss'
})
export class EmbedSdkComponent {
  userName!: string;
  apibaseurl!: string;
  disableSDKName : boolean = false;
  displayScript : boolean = false;
  host!: string;
  port!: string;
  selectedDashboardId!: number;
  clientId!: string;
  clientSecret! : string;
  dashboardToken! : string;
  scriptContent!: string;
  showNotifier: boolean = false;
  isSheetSDK: boolean = false;
  isDashboardSDK: boolean = false;
  sheetId!: number;
  sheetName: string = "";
  sheetToken!: string;

  constructor(private workbechService: WorkbenchService,private router:Router,private route:ActivatedRoute){
    const currentUrl = this.router.url; 
    if (currentUrl.includes('configure-page/sheet/sdk')) {
      this.isSheetSDK = true;
      this.isDashboardSDK = false;
      if (route.snapshot.paramMap.has('sheetId')) {
        this.sheetId = +atob(route.snapshot.params['sheetId']);
      }
    } else {
      this.isDashboardSDK = true;
      this.isSheetSDK = false;
    }
  }

  getHostAndPort(): void {
    const { hostname, port } = window.location;
    this.host = hostname;
    this.port = port;
    this.apibaseurl = this.port ? 'https://'+this.host+':'+this.port + '/' : 'https://'+this.host + '/'
  }

  getAppDetails(){
    this.workbechService.fetchSDKData().subscribe({
      next: (responce: any) => {
        console.log(responce);
        if(responce && responce[0] && responce[0].redirect_url){
          this.userName = responce[0].app_name;
          this.apibaseurl = responce[0].redirect_url;
          this.clientId = responce[0].client_id;
          this.disableSDKName = true;
        } else {
          const currentUser = localStorage.getItem( 'username' );
          this.userName = JSON.parse( currentUser! )['userName'];
          this.getHostAndPort();
        }   
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }

  ngOnInit(){
    this.getAppDetails();
    if(this.isDashboardSDK){
      this.getDashboardsList();
    } else if(this.isSheetSDK){
      this.fetchSheetName();
    }
  }

  fetchSheetName(){
    this.workbechService.getSheetName(this.sheetId).subscribe({
      next: (responce: any) => {
        console.log(responce);
        this.sheetName = responce.sheet_name;
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }

  dashboardList : any[] = [];
  getDashboardsList() {
    this.workbechService.getuserDashboardsList().subscribe({
      next: (responce: any) => {
        console.log(responce);
        this.dashboardList = responce;
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }

  setSheetScriptData(){
    this.scriptContent = `
    import AnalytifySDK from 'https://cdn.jsdelivr.net/gh/Rajashekarreddy24/Analytify-Angular@v2.1.1/public/analytify-sdk.js';

    const analytify = AnalytifySDK.init({
      appName: '${this.userName}',
      clientId: '${this.clientId}',
      clientSecret: '${this.clientSecret}',
      apiBaseUrl: '${this.apibaseurl}'
    });

    analytify.embedSheet({
      container: '#sheet-container',
      sheetToken: '${this.sheetToken}',
      width: '100%',
      height: '500px',
    });
  `;
  }

  setScriptData(){
    this.scriptContent = `
    <script src="https://dh21hlbo933ey.cloudfront.net/analytify-dashboard/v1.0.0/analytify-sdk.js"></script>

    const analytify = AnalytifySDK.init({
      appName: '${this.userName}',
      clientId: '${this.clientId}',
      clientSecret: '${this.clientSecret}',
      apiBaseUrl: '${this.apibaseurl}'
    });

    analytify.loadDashboard({
      container: '#dashboard-container',
      dashboardToken: '${this.dashboardToken}',
      width: '100%',
      height: '1000px',
    });
  `;
  }

  submitSDKKeys(){
    let payload = {
      app_name: this.userName,
      redirect_uri : this.apibaseurl,
    }
    if(this.disableSDKName && this.isDashboardSDK){ 
       this.submitDashboardId();
    } else if(this.disableSDKName && this.isSheetSDK){ 
      this.submitSheetId();
   } else {
     this.workbechService.saveSDKData(payload).subscribe({
      next: (data: any) => {
        this.clientId = data.client_id;
        this.clientSecret = data.client_secret;
        this.disableSDKName = true;
        this.showNotifier = true;
        this.submitDashboardId();
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }
  }
  submitSheetId(){
    let dashboardPayload = {
      client_id : this.clientId,
      sheet_id: this.sheetId
    }
    this.workbechService.fetchSheetToken(dashboardPayload).subscribe({
      next: (data: any) => {
        this.sheetToken = data.sheet_token;
        this.disableSDKName = true;
        this.displayScript = true;
        this.setSheetScriptData();
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }

  submitDashboardId(){
    let dashboardPayload = {
      client_id : this.clientId,
      dashboard_id: this.selectedDashboardId
    }
    this.workbechService.fetchDashboardToken(dashboardPayload).subscribe({
      next: (data: any) => {
        this.dashboardToken = data.dashboard_token;
        this.disableSDKName = true;
        this.displayScript = true;
        this.setScriptData();
      },
      error: (error:any) => {
        console.log(error);
      }
    })
  }                                                                                                           
            
}
