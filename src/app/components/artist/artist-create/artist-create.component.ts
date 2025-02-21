import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {Artist} from "../../../dtos/artist";
import {ErrorFormatterService} from "../../../services/error-formatter.service";
import {ToastrService} from "ngx-toastr";
import {ArtistService} from "../../../services/artist.service";
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: 'app-artist-create',
  standalone: true,
    imports: [
        FormsModule,
        NgForOf,
        NgIf
    ],
  templateUrl: './artist-create.component.html',
  styleUrl: './artist-create.component.scss'
})

export class ArtistCreateComponent {
  artist: Artist = {
    name: '',
    text: '',
    summary: '',
    imageUrl: null,
    shows: []
  };

  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;



  errorMessage: string = '';
  submitted = false;

  constructor(
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private artistService: ArtistService,
    private authService: AuthService
  ) { }

  ngOnInit() {
  }

  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  /**
   * Handles image selection from the input field and creates a preview.
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];

      // Generate preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  /**
   * Removes the selected image and clears the preview.
   */
  removeImage(): void {
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }



  /**
   * Handles form submission.
   */
  onSubmit(): void {
    this.submitted = true;

    const formData = new FormData
    formData.append('artist', new Blob([JSON.stringify(this.artist)], { type: 'application/json' }));
    formData.append("image", this.selectedImage);


    this.artistService.createArtist(formData).subscribe({
      next: (response) => {
        console.log('Artist added successfully:', response);
        this.notification.success(`Artist ${this.artist.name} added successfully.`);
        this.clearForm();
      },
      error: (err) => {
        console.error('Error adding artist:', err);
        this.notification.error(this.errorFormatter.format(err), 'Could not add artist.');
      }
    });
  }

  /**
   * Clears the form and resets all fields
   */
  private clearForm(): void {
    this.artist = {
      name: '',
      summary: '',
      text: '',
      imageUrl: null,
      shows:[]
    };
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.submitted = false;
  }

  /**
   * Hides the error message.
   */
  vanishError(): void {
    this.errorMessage = '';
  }
}
