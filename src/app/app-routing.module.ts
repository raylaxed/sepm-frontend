import {NgModule} from '@angular/core';
import {mapToCanActivate, RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {AuthGuard} from './guards/auth.guard';
import {NewsComponent} from './components/news/news.component';
import {MessageComponent} from './components/message/message.component';
import {HallComponent} from './components/hall/hall.component'
import { HallDisplayComponent } from './components/hall-display/hall-display.component';
import { HallEditComponent } from './components/hall-edit/hall-edit.component';
import {ShowCreateComponent} from "./components/show/show-create/show-create.component";
import {EventCreateComponent} from "./components/event/event-create/event-create.component";
import { AdminHomeComponent } from './components/admin-home/admin-home.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import {NewsInfoComponent} from "./components/news/news-info/news-info.component";
import {RegistrationComponent} from "./components/registration/registration.component";
import {TopTenEventsComponent} from "./components/event/top-ten-events/top-ten-events.component";
import {VenueManagementComponent} from "./components/venue-management/venue-management.component";
import {VenueCreateComponent} from "./components/venue-create/venue-create.component";
import {VenueEditComponent} from "./components/venue-edit/venue-edit.component";
import { EventFilterComponent } from "./components/event/event-filter/event-filter.component";
import { EventDetailComponent } from "./components/event/event-detail/event-detail.component";
import {ArtistCreateComponent} from "./components/artist/artist-create/artist-create.component";
import { UpdatePasswordComponent } from './components/update-password/update-password.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { EventManagementComponent } from './components/event-management/event-management.component';
import { NewsManagementComponent } from './components/news-management/news-management.component';
import { BlockUserComponent} from "./components/block-user/block-user.component";
import {ArtistFilterComponent} from "./components/artist/artist-filter/artist-filter.component";
import {ArtistDetailComponent} from "./components/artist/artist-detail/artist-detail.component";
import { ShowDetailComponent } from './components/show/show-detail/show-detail.component';
import { HallSelectComponent } from './components/hall-select/hall-select.component';
import { ShowFilterComponent} from "./components/show/show-filter/show-filter.component";
import { CartComponent } from './components/cart/cart.component';
import {VenueFilterComponent} from "./components/venue-filter/venue-filter.component";
import {VenueDetailComponent} from "./components/venue-detail/venue-detail.component";
import { SearchResultsComponent } from './components/search-results/search-results.component';
import {LocationStrategy, PathLocationStrategy} from "@angular/common";
import {TicketManagementComponent} from "./components/ticket-management/ticket-management.component";
import { GalleryComponent } from './components/gallery/gallery.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'reset-password', component: UpdatePasswordComponent},

  {path: 'registration', component: RegistrationComponent},

  {path: 'venues', component: HallComponent, canActivate: mapToCanActivate([AuthGuard])},

  { path: 'halls', component: HallDisplayComponent },
  { path: 'halls/:id', component: HallEditComponent },
  {path: 'halls/create', component: HallComponent, canActivate: mapToCanActivate([AuthGuard])},

  {path: 'create-event', canActivate: mapToCanActivate([AuthGuard]), component: EventCreateComponent},
  {path: 'profile/edit', component: UserEditComponent},
  {path: 'top-ten', component: TopTenEventsComponent},
  {path: 'filter-event', component: EventFilterComponent},
  {path: 'event-detail/:id', component: EventDetailComponent},

  {
    path: 'news',
    component: NewsComponent
  },
  {
    path: 'news/details/:id',
    loadComponent: () => import('./components/news/news-info/news-info.component').then(m => m.NewsInfoComponent)
  },

  {path: 'admin', canActivate: mapToCanActivate([AuthGuard]), component: AdminHomeComponent},
  {path: 'admin/venues',canActivate: mapToCanActivate([AuthGuard]),component: VenueManagementComponent,},
  {path: 'admin/venues/new',canActivate: mapToCanActivate([AuthGuard]),component: VenueCreateComponent,},
  {path: 'admin/venues/:id/edit',canActivate: mapToCanActivate([AuthGuard]),component: VenueEditComponent,},

  {path: 'admin/users', canActivate: mapToCanActivate([AuthGuard]), component: UserManagementComponent},

  {path: 'admin/users/block-user', canActivate: mapToCanActivate([AuthGuard]), component: BlockUserComponent},

  {path: 'create-show', canActivate: mapToCanActivate([AuthGuard]), component: ShowCreateComponent},

  {path: 'create-artist', canActivate: mapToCanActivate([AuthGuard]), component: ArtistCreateComponent},
  {path: 'filter-artist', component: ArtistFilterComponent},
  {path: 'artist-detail/:id', component: ArtistDetailComponent},

  {path: 'message', canActivate: mapToCanActivate([AuthGuard]), component: MessageComponent},
  {path: 'profile', component: ProfilePageComponent},
  {path: 'profile/edit', component: UserEditComponent},
  {path: 'cart', canActivate: mapToCanActivate([AuthGuard]), component: CartComponent},
  {path: 'admin/events', canActivate: mapToCanActivate([AuthGuard]), component: EventManagementComponent},
  {path: 'admin/news', canActivate: mapToCanActivate([AuthGuard]), component: NewsManagementComponent},
  {path: 'show-detail/:id', component: ShowDetailComponent},
  {path: 'filter-show', component: ShowFilterComponent},
  {path: 'hall-select', component: HallSelectComponent},
  {path: 'ticket-management', canActivate: mapToCanActivate([AuthGuard]), component: TicketManagementComponent},
  {path: 'filter-venue', component: VenueFilterComponent},
  {path: 'venue-detail/:id', component: VenueDetailComponent},
  {path: 'search', component: SearchResultsComponent},
  {path: 'gallery', component: GalleryComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy}
  ]
})
export class AppRoutingModule {
}
