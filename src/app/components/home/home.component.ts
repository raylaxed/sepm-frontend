import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {HallService} from '../../services/hall.service';
import {UserService} from '../../services/user.service';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    public authService: AuthService,
    private hallService: HallService,
    private userService: UserService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  

}
