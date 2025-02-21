import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import {FooterComponent} from './components/footer/footer.component';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {MessageComponent} from './components/message/message.component';
import {NewsComponent} from './components/news/news.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {httpInterceptorProviders} from './interceptors';
import { VenueManagementComponent } from './components/venue-management/venue-management.component';
import { UpdatePasswordComponent } from "./components/update-password/update-password.component";
import { BlockUserComponent} from "./components/block-user/block-user.component";
import {NgOptimizedImage} from "@angular/common";

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        HomeComponent,
        LoginComponent,
        MessageComponent,
        UpdatePasswordComponent,
        BlockUserComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        ReactiveFormsModule,
        NgbModule,
        FormsModule,
        ToastrModule.forRoot({
            enableHtml: true,
            progressBar: true,
            preventDuplicates: true,
            resetTimeoutOnDuplicate: true
        }),
        VenueManagementComponent,
        HeaderComponent,
        NgOptimizedImage,
        NewsComponent
    ],
    providers: [httpInterceptorProviders, provideHttpClient(withInterceptorsFromDi())],
    bootstrap: [AppComponent]

})
export class AppModule {
}
