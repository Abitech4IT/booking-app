import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PlaceLocation } from './location.model';

// [
//   new Place(
//     'p1',
//     'The Acca Santa',
//     'The Acca Santa Event Hall in Kwara state',
//     '../../assets/images/pl1.jpeg',
//     149.99,
//     new Date('2020-01-01'),
//     new Date('2020-12-31'),
//     'abc'
//   ),
//   new Place(
//     'p2',
//     'The Bovina View',
//     'The ilorin Bovina Event Center in kwara state',
//     '../../assets/images/pl2.jpeg',
//     189.99,
//     new Date('2020-01-01'),
//     new Date('2020-12-31'),
//     'abc'
//   ),
//   new Place(
//     'p3',
//     'The Nimatoni Events Centre',
//     'The Nimatoni Events Center Unity Road',
//     '../../assets/images/pl3.jpeg',
//     99.9,
//     new Date('2020-01-01'),
//     new Date('2020-12-31'),
//     'abc'
//   ),
// ]

interface placeData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]); 

  constructor(private authService: AuthService, private http: HttpClient) { }

  get places() {
    return this._places.asObservable();
  }

  fetchedPlaces(){
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.get<{[key: string]: placeData}>(
        `https://booking-app-e950d.firebaseio.com/offered-places.json?auth=${token}`)

    }), map(resData => {
      const places = [];
      for(const key in resData){
        if(resData.hasOwnProperty(key)){
          places.push(new Place(
            key,
            resData[key].title,
            resData[key].description,
            resData[key].imageUrl,
            resData[key].price,
            new Date(resData[key].availableFrom),
            new Date(resData[key].availableTo),
            resData[key].userId,
            resData[key].location
          ));
        }
      }
      return places;
    }), tap(places => {
      this._places.next(places);
    }));
  }

  getPlace(id: string){
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.get<placeData>(
        `https://booking-app-e950d.firebaseio.com/offered-places/${id}.json?auth=${token}`)

    }), map(placeData => {
      return new Place(
        id,
        placeData.title,
        placeData.description,
        placeData.imageUrl,
        placeData.price,
        new Date(placeData.availableFrom),
        new Date(placeData.availableTo),
        placeData.userId,
        placeData.location
      );
    }));
  }

  uploadImage(image: File){
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.post<{imageUrl: string, imagePath: string}>(
        'https://us-central1-booking-app-e950d.cloudfunctions.net/storeImage', 
        uploadData, {headers: {Authorization: 'Bearer' + token }});
    }));
  }
   

  addPlace(title: string, description: string, price: number, dateFrom: Date, 
    dateTo: Date, location: PlaceLocation, imageUrl: string){
    let generatedId: string;
    let fetchedUserId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      fetchedUserId = userId;
      return this.authService.token;

    }), take(1),
     switchMap(token => {
      if(!fetchedUserId){
        throw new Error('No user found');
      }
      newPlace = new Place(
        Math.random().toString(),
        title,
        description,
        imageUrl,
        price,
        dateFrom,
        dateTo,
        fetchedUserId,
        location
      );
      return this.http.post<{name: string}>(`
      https://booking-app-e950d.firebaseio.com/offered-places.json?auth=${token}`, 
      {...newPlace, id: null})
    }), switchMap(resData => {
      generatedId = resData.name;
      return this.places;
    }), take(1), tap(places => {
        newPlace.id = generatedId;
        this._places.next(places.concat(newPlace));
      }) 
      
      );

    // return this.places.pipe(take(1), delay(1000), tap(places => {
    //     this._places.next(places.concat(newPlace));
    // })
    // );
  }

  updatePlace(placeId: string, title: string, description: string){
    let updatedplaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(take(1), switchMap(token => {
      fetchedToken = token;
      return this.places;
    }), take(1), switchMap(places => {
      if(!places || places.length <= 0){
        return this.fetchedPlaces();
      }else {
        return of(places);
      }
     
    }), switchMap(places => {
      const updatedplaceIndex = places.findIndex(pl => pl.id === placeId);
      updatedplaces = [...places];
      const oldPlace = updatedplaces[updatedplaceIndex];
      updatedplaces[updatedplaceIndex] = new Place(
        oldPlace.id,
        title,
        description,
        oldPlace.imageUrl,
        oldPlace.price,
        oldPlace.availableFrom,
        oldPlace.availableTo,
        oldPlace.userId,
        oldPlace.location
        );
        return this.http.put(
          `https://booking-app-e950d.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`, 
        {...updatedplaces[updatedplaceIndex], id: null});
    }), tap(() => {
      this._places.next(updatedplaces);
    }));
     
  }
  
}
