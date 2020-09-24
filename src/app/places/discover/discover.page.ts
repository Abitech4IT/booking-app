import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { MenuController } from '@ionic/angular';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces: Place[];
  isLoading = false;
  listedLoadedPlaces: Place[];
  relevantPlaces: Place[];
  private placesSub: Subscription;

  constructor(private placesService: PlacesService, 
    private MenuCtrl: MenuController, private authService: AuthService) { }

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(places => { 
      this.loadedPlaces = places;
      this.relevantPlaces = this.loadedPlaces;
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  onOpenMenu(){
    this.MenuCtrl.toggle();

  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>){
    this.authService.userId.pipe(take(1)).subscribe(userId => {
      if(event.detail.value === 'all'){
        this.relevantPlaces = this.loadedPlaces;
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      } else {
        this.relevantPlaces = this.loadedPlaces.filter(place => 
          place.userId !== userId
        );
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }

    })
    
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.placesService.fetchedPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

}
