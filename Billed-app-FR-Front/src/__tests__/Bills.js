/**
 * @jest-environment jsdom
 */
import {screen,getByTestId,getAllByTestId,getByText,waitFor} 
from "@testing-library/dom";
import '@testing-library/jest-dom/extend-expect'
 import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills"
import { ROUTES,ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"

import userEvent from "@testing-library/user-event";
import { setSessionStorage } from "../../setup-jest";

import Store from "../app/Store";
import store from "../__mocks__/store";
import mockStore from '../__mocks__/store';

import router from "../app/Router.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
Object.defineProperty(window, 'localStorage', {value:localStorageMock})
window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))

const constructBillsUi = () => {
  const html = BillsUI({ data: bills });
  document.body.innerHTML = html;
};

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on 'nouvelle note de frais'", () => {
      test("Then I should be redirected to the new bill page", () => {
        constructBillsUi();

        const bills = new Bills({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
        });
  
        const fnHandleClickNewBill = jest.fn(bills.handleClickNewBill);  
        const ButtonNewBill = getByTestId(document.body, "btn-new-bill");  
        ButtonNewBill.addEventListener("click", fnHandleClickNewBill);
        //verify if buttonNewBill is in DOM
        expect(ButtonNewBill).toBeTruthy();
        userEvent.click(ButtonNewBill);
  
        expect(fnHandleClickNewBill).toHaveBeenCalled();
        expect(
          getByText(document.body, "Envoyer une note de frais")
        ).toBeTruthy();
      })
    })

    //test if the modal is displayed when clicking on the eye icon
    describe("When I click on eye icon", () => {
      test("Then modale page should appear", () => {
        constructBillsUi();
        // Init firestore
        const store = null;
  
        // init Bills Class constructor for icon eye display
        const bills = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
  
        // Mock modal
        $.fn.modal = jest.fn();
  
        // Get the first button eye in DOM for test
        const firstEyeIcon = getAllByTestId(document.body, "icon-eye")[0];
  
        //Mock handleClickIconEye function on bills , line : 27
        const handleClickIconEye = jest.fn(
          bills.handleClickIconEye(firstEyeIcon)
        );
  
        //Attached events and trigged
        firstEyeIcon.addEventListener("click", handleClickIconEye);
        //trigger event click
        userEvent.click(firstEyeIcon);
  
        const modal = document.getElementById("modaleFile");
        expect(handleClickIconEye).toHaveBeenCalled();
        //Check if modal has show in DOM
        expect(modal).toBeTruthy();    
      })
      test("Then modale page should have the correct data", () => {
        constructBillsUi();
        // Init firestore
        const store = null;
  
        // init Bills Class constructor for icon eye display
        const bills = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
  
        // Mock modal
        $.fn.modal = jest.fn();
  
        // Get the first button eye in DOM for test
        const firstEyeIcon = getAllByTestId(document.body, "icon-eye")[0];
  
        //Mock handleClickIconEye function on bills , line : 27
        const handleClickIconEye = jest.fn(
          bills.handleClickIconEye(firstEyeIcon)
        );
  
        //Attached events and trigged
        firstEyeIcon.addEventListener("click", handleClickIconEye);
        //trigger event click
        userEvent.click(firstEyeIcon);
  
        //Check if modal has show in DOM
        const modal = document.getElementById("modaleFile");
        expect(modal).toBeTruthy();

        //Check if modal has the correct data
        const modalTitle = document.querySelector(".modal-title").innerHTML;
        const modalBody = document.querySelector(".modal-body").innerHTML;
        expect(modalTitle).toBe("Justificatif");
        //expect modal body to not be empty
        expect(modalBody).not.toBe("");
      })
    })

    //test getBills function
    test('It should return bills data', async () => {
      
      mockStore.bills = jest.fn().mockImplementationOnce(() => {
        return {
          list: jest.fn().mockResolvedValue([
            { 
              id: 1, 
              data: () => ({ date: '' }) 
            }
          ])
        }
      })

      const bills = new Bills({
        document, onNavigate, store: mockStore, localStorage
      })

      const res = bills.getBills()

      expect(res).toEqual(Promise.resolve({}))
    })
    
      
  })
  
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test('Fetches bills from mock API GET', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = ROUTES({ pathname: ROUTES_PATH.Bills, data: bills })

      await waitFor(() => screen.getByText("Mes notes de frais"))

      expect(
        screen.getByText("Mes notes de frais")
      ).toBeTruthy()
      expect(
        screen.getByTestId('tbody')
      ).not.toBeEmptyDOMElement()
    })
  })
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("Fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})
      const billsDom = BillsUI({error: "Erreur 404"})
      document.body.innerHTML = billsDom
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})
      const billsDom = BillsUI({error: "Erreur 500"})
      document.body.innerHTML = billsDom
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
